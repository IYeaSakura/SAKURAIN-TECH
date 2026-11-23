# GitLab Runner 容器化部署

> 环境：Ubuntu 26.04 LTS ｜ Docker + Compose V2 ｜ GitLab Runner 17.x（docker executor）
> 前置：已完成 [GitLab CE](/docs/deploy/gitlab-ce) 与 [registry:2](/docs/deploy/registry) 部署（本文的 CI 闭环依赖这两者）
> 特点：GitLab 17 使用 authentication token（glrt-）注册，老教程的 --registration-token 流程已废弃

---

## 1 架构

```
git push ──> GitLab（gitlab:8181，proxy 网络）──轮询──> gitlab-runner（proxy 网络）
                                                            │ docker executor：
                                                            │ 挂载宿主 docker.sock，
                                                            │ 在宿主 Docker 上拉起 job 容器
                                                            ▼
                              job 容器（加入 proxy 网络，能按容器名访问 gitlab 与 registry）
                                 │ docker build / push
                                 ▼
                        registry:2（registry:5000，proxy 网络）
```

- Runner **不需要域名也不需要开放端口**——它主动向 GitLab 发起轮询拉取任务，出方向连接即可
- Runner 挂载宿主 `/var/run/docker.sock`，job 容器实际是宿主的"兄弟容器"——这也是本服务器上**第一个特权级挂载**，安全边界见第 11 节
- 关键设计：job 容器通过 `network_mode = "proxy"` 加入 proxy 网络，于是 CI 里可以直接用 `gitlab`、`registry` 容器名互访，全程不绕公网

## 2 前置检查

```bash
# GitLab 与 registry 都在线
docker ps --format '{{.Names}}\t{{.Status}}' | grep -E 'gitlab|registry'

# 内存余量（Runner 本身很轻，但构建 job 会瞬时冲高）
free -h
```

## 3 获取注册令牌（GitLab 17 新流程）

老教程让你去 Admin → Overview → Runners 找 `--registration-token`——**17.x 已废弃**，那个入口消失了。新流程：

1. GitLab 右上角 **扳手（Admin / 管理员）→ CI/CD → Runner**
2. 点  **"New instance runner"** （创建实例 Runner，所有项目可用）
3. 表单里填：
   - Tags（标签）：`docker`（稍后注册时要一致）
   - Maximum job timeout（最大作业超时）：留空
4. 点 **Create runner（创建 runner）**  → 页面给出以 `glrt-` 开头的 **authentication token**
5. **只显示一次，复制保存**（丢了就重建一个，无成本）

## 4 部署 Runner

### compose（/opt/gitlab-runner/docker-compose.yml）

```yaml
services:
  gitlab-runner:
    image: gitlab/gitlab-runner:ubuntu-v17.5.0    # 与 GitLab 同大版本；升级时两边一起升
    container_name: gitlab-runner
    volumes:
      - ./config:/etc/gitlab-runner                # 注册信息落盘，重建不丢身份
      - /var/run/docker.sock:/var/run/docker.sock  # docker executor 的命脉（见安全清单）
    restart: unless-stopped
    networks:
      - proxy

networks:
  proxy:
    external: true
```

```bash
mkdir -p /opt/gitlab-runner/config && cd /opt/gitlab-runner
docker compose up -d
```

## 5 注册到 GitLab

```bash
# 交互式注册（容器内执行；URL 用容器名，走 proxy 网络内网）
docker compose exec -it gitlab-runner gitlab-runner register
```

依次回答：

|提示|输入|
| ----------------------| -----------------------------------------|
|GitLab instance URL|`http://gitlab:8181`（内网地址，job 的 clone 也走这里）|
|Registration token|第 3 步复制的 `glrt-xxxxxxxx`|
|Description|`sakurain-runner`|
|Executor|`docker`|
|Default Docker image|`docker:24`|
|Tags（若有）|`docker`|

注册成功后，生成的 `config.toml` 里关键是这几行（自动写好，了解即可）：

```toml
[[runners]]
  url = "http://gitlab:8181"
  executor = "docker"
  [runners.docker]
    image = "docker:24"
    volumes = ["/var/run/docker.sock:/var/run/docker.sock", "/cache"]
    network_mode = "proxy"        # ← 若自动生成的没有这行，手动补上（job 容器进 proxy 网络的关键）
```

**验证**：GitLab Admin → CI/CD → Runners，看到 `sakurain-runner` 绿点在线。

## 6 配置 CI 变量（registry 凭据不入库）

GitLab 顶部菜单 → **Admin → Settings → CI/CD → Variables**（实例级）或在你的项目里 **Settings → CI/CD → Variables**（项目级）：

|Key|Value|勾选|
| ---| ---------------------------| ------|
|`REGISTRY_USER`|registry 的 htpasswd 用户名|Masked|
|`REGISTRY_PASSWORD`|registry 的 htpasswd 密码|Masked|

> Masked 后流水线日志里这些值显示为 `[MASKED]`——**密码永远不进 `.gitlab-ci.yml` ，这是 CI 安全的第一课**。

## 7 第一条流水线（.gitlab-ci.yml）

把 AutoOps 推上 GitLab 后，在项目根目录建 `.gitlab-ci.yml`：

```yaml
stages:
  - test
  - build

variables:
  IMAGE: registry.sakurain.net/lhyt/autoops

# 阶段一：语法/导入检查（Python 编译层面，快速失败）
test:
  stage: test
  image: python:3.12-slim
  script:
    - python -m compileall core scripts launcher.py
  tags: [docker]

# 阶段二：构建镜像并推送私有仓库（用宿主 docker.sock，不用 dind，免特权）
build:
  stage: build
  image: docker:24
  variables:
    DOCKER_HOST: unix:///var/run/docker.sock     # 让 cli 找到挂载进来的 sock
  script:
    - echo "$REGISTRY_PASSWORD" | docker login -u "$REGISTRY_USER" --password-stdin registry.sakurain.net
    - docker build -t "$IMAGE:$CI_COMMIT_SHORT_SHA" -t "$IMAGE:latest" .
    - docker push "$IMAGE:$CI_COMMIT_SHORT_SHA"
    - docker push "$IMAGE:latest"
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  tags: [docker]
```

push 上去，GitLab 项目页顶部出现 ** pipelines 小圆点**——转圈就是 Runner 干活了。

> **AutoOps 平台说明**：PyInstaller 打包的是 Windows exe，Linux 容器里打不出来。本文流水线产出的是**服务化镜像**（为阶段二的 k3s 部署铺路）；Windows 安装包建议保留本地 `installer.bat` 或将来在公司 Windows 机器挂一个 shell executor Runner 专门打包（注意先确认公司规定）。

## 8 验收标准

1. **Runners 绿点在线**（Admin → CI/CD → Runners）
2. **pipeline 全绿**（项目 → Build → Pipelines，两个 job 都 passed）
3. **registry 里见到镜像**：
   ```bash
   curl -s -u '<用户>:<密码>' https://registry.sakurain.net/v2/_catalog
   curl -s -u '<用户>:<密码>' https://registry.sakurain.net/v2/lhyt/autoops/tags/list
   ```
4. 以后每次 push 到 main，自动测试 + 构建 + 推送——**阶段一 CI/CD 闭环正式焊死**

## 9 已知坑与对策

|现象|原因与对策|
| ----------------------| -----------------------------------------------------------------------------------|
|job 日志 `Could not resolve host: gitlab`|job 容器没进 proxy 网络：`config.toml` 的 `[runners.docker]` 里补 `network_mode = "proxy"`，然后 `docker compose restart gitlab-runner`|
|job 日志 `Cannot connect to the Docker daemon`|`DOCKER_HOST` 没设，或 docker.sock 没挂进 runner 容器|
|`docker: command not found` 或 login 后仍 `unauthorized`|job 用了精简镜像没 docker cli；用 `image: docker:24` 并设 `DOCKER_HOST`|
|Runner 注册时 `dial tcp: lookup gitlab: no such host`|runner 不在 proxy 网络：检查 compose 的 networks|
|`glrt-` token 注册报 401|token 复制错/多了空格；或 GitLab 与 Runner 大版本错位（17.x Runner 配 17.x GitLab）|
|job 拉镜像极慢|宿主 daemon.json 的 mirror 对 job 同样生效，确认 `docker info` 里 Registry Mirrors 在|
|并发 job 把内存打爆|`config.toml` 全局 `concurrent = 1`（默认就是 1），单 runner 串行执行|
|push main 没触发流水线|`rules` 分支名写错，或文件没 push 到仓库根目录|

## 10 日常维护

|事项|操作|
| -----------------| --------------------------------------------|
|Runner 状态|`docker compose logs -f gitlab-runner`；`docker exec gitlab-runner gitlab-runner status`|
|清空 build 缓存|job 的 `/cache` 在容器层，宿主机 `docker system df` 看占用，`docker builder prune` 可清|
|升级|与 GitLab **同大版本一起升**：两边 compose 同步改 tag → `docker compose up -d`|
|换 token 重新注册|删 `./config` 里的 runner 段或整个 `./config`，重复第 3~5 步|
|磁盘监控|镜像构建层越攒越多：`docker system df` 每周看一眼，`docker image prune` 清悬空镜像|

## 11 安全清单

- [ ] Runner 未映射任何宿主机端口
- [ ] `config.toml` 里没有明文 token 之外的敏感信息（glrt- token 已在文件里，等同密码——`./config` 不进 Git、权限 600）
- [ ] **理解并接受 docker.sock 挂载的边界**：能提交 pipeline 的人（你自己）等于能控制宿主 Docker——这是单人自用可接受、多人共用必须上隔离（dind/k8s executor）的分水岭
- [ ] CI 变量已 Masked，且 `.gitlab-ci.yml` 中无硬编码密码
- [ ] `concurrent = 1`（个人环境串行，防内存打爆）
- [ ] Runner 与 GitLab 大版本一致

---

## 版本说明

- Runner：`gitlab/gitlab-runner:ubuntu-v17.5.0`（与 GitLab CE 17.5.0 同大版本配套）
- 注册方式：GitLab 17 authentication token（`glrt-` 前缀），`--registration-token` 旧流程已废弃
- Executor：docker（挂载宿主 docker.sock 模式，非 privileged/dind）——个人环境最简方案；多租户/生产环境应改用 Kubernetes executor 或隔离的 dind
- CI 范式：`rules` + 分支保护，`$CI_COMMIT_SHORT_SHA` 作为镜像版本标签（可追溯、可回滚）
- Compose：V2 语法（无 `version:` 字段）

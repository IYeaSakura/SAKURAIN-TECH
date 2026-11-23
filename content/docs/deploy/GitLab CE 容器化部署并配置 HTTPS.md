# GitLab CE 容器化部署并配置 HTTPS

> 环境：Ubuntu 26.04 LTS ｜ Docker + Compose V2 ｜ GitLab CE（Omnibus 容器版）
> 域名：gitlab.sakurain.net ｜ 前置：已按[《Nginx 容器化部署和使用》](/docs/deploy/nginx)部署好 nginx-proxy

---

## 1 架构

```
开发者 ──HTTPS──> nginx（80/443，gitlab.sakurain.net 的 server block）
                     │ proxy_pass http://gitlab:8181（proxy 网络，容器名互访）
                     ▼
              gitlab 容器（Web 不映射宿主机端口，公网零直达；
                           仅 SSH 映射宿主机 2222 → 容器 22）

git push/clone（SSH）：git@gitlab.sakurain.net:2222
```

- 与 DSH 同一套反代模式：nginx 独占 80/443，GitLab Web 只在内网可达
- GitLab 自带完整的账号体系，**不需要** Basic Auth（加一层反而干扰 git 客户端认证）
- 与 DSH 的关键差异：GitLab 是 Omnibus 全家桶（Rails + PostgreSQL + Redis + Gitaly…），重得多

## 2 前置检查

```bash
# 域名 A 记录：gitlab → 服务器公网 IP
dig +short gitlab.sakurain.net

# ⚠️ 内存检查——GitLab CE 官方最低 4G，舒适线 8G
free -h
```

**内存不足 4G 必须先加 swap**（否则启动即 OOM，症状是容器反复重启）：

```bash
fallocate -l 4G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl -w vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.conf
```

> 镜像拉取走已配置的腾讯云 mirror：`gitlab/gitlab-ce:latest` 会自动经由 mirror.ccs.tencentyun.com；拉不动就用 `docker.m.daocloud.io/gitlab/gitlab-ce` 前缀手动拉 + retag。

## 3 部署 GitLab CE

### 3.1 目录与 compose（/opt/gitlab/docker-compose.yml）

```yaml
services:
  gitlab:
    image: gitlab/gitlab-ce:17.5.0-ce.0
    container_name: gitlab
    hostname: gitlab.sakurain.net
    environment:
      TZ: Asia/Shanghai
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'https://gitlab.sakurain.net'
        # 关闭内置 nginx——TLS 与入口由外层 nginx-proxy 负责
        nginx['enable'] = false
        gitlab_workhorse['listen_network'] = "tcp"
        gitlab_workhorse['listen_addr'] = "0.0.0.0:8181"
        # SSH 克隆提示端口（宿主 2222 → 容器 22）
        gitlab_rails['gitlab_shell_ssh_port'] = 2222
        # 注册邀请制：关掉公开注册，只留管理员手动建号
        gitlab_rails['gitlab_signup_enabled'] = false
        # 信任反代所在网段（消除 CSRF/HTTPS 误判，网段以 docker network inspect proxy 为准）
        gitlab_rails['trusted_proxies'] = ['172.18.0.0/16', '172.19.0.0/16']
    volumes:
      - ./config:/etc/gitlab
      - ./logs:/var/log/gitlab
      - ./data:/var/opt/gitlab
    ports:
      - "2222:22"                # 仅 SSH 需要暴露宿主机端口；Web 不发布
    shm_size: "256m"
    restart: unless-stopped
    networks:
      - proxy

networks:
  proxy:
    external: true
```

### 3.2 启动

```bash
mkdir -p /opt/gitlab/{config,logs,data} && cd /opt/gitlab
docker compose up -d

docker compose logs -f gitlab        # 盯着日志， healthy 大约需要 3~8 分钟
docker compose ps                    # (healthy) 后再继续
```

**首趟初始化极慢是正常现象**（Omnibus 要初始化 PostgreSQL、编译资产、跑迁移），日志刷到 `gitlab Reconfigured!` 才算完。**不要在健康检查转绿前 reload nginx**，否则 502 排错会误伤无辜。

## 4 申请子域名证书

与 DSH 完全同一套路（default.conf 的 `server_name _` 通配已兜住 ACME 验证）：

```bash
cd /opt/nginx-proxy
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d gitlab.sakurain.net \
  --email wangyuyang2004@foxmail.com --agree-tos --no-eff-email
```

## 5 配置 nginx vhost 并生效

新建 `/opt/nginx-proxy/nginx/conf.d/gitlab.sakurain.net.conf`：

```nginx
server {
    listen 80;
    server_name gitlab.sakurain.net;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    http2 on;
    server_name gitlab.sakurain.net;

    ssl_certificate     /etc/letsencrypt/live/gitlab.sakurain.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gitlab.sakurain.net/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # GitLab 文件上传/大 clone 需要大缓冲与长超时
    client_max_body_size 512m;

    location / {
        proxy_pass http://gitlab:8181;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;   # ← 关键：GitLab 靠它判断 HTTPS
        proxy_read_timeout 3600s;
        proxy_buffering off;                          # 大文件 push/clone 更稳
    }
}
```

```bash
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

## 6 访问与首次配置

浏览器打开 `https://gitlab.sakurain.net`：

1. **初始 root 密码**（只存在 24 小时，尽快改）：
   ```bash
   docker exec gitlab cat /etc/gitlab/initial_root_password
   ```
2. 用户名 `root` 登录 → 头像 → **Preferences → Password** 立即改密
3. Admin 面板确认注册已关（Settings → General → Sign-up restrictions）

创建第一个项目后，页面显示的克隆地址就是 `https://gitlab.sakurain.net/xxx/xxx.git`——**不需要任何额外配置**，`external_url` 生效了。

## 7 Git over SSH

宿主机 22 已被系统 SSH 占用，GitLab SSH 走 2222（已在 compose 中映射并配置提示端口）：

```bash
# 测试连通
ssh -T -p 2222 git@gitlab.sakurain.net
# 首次会提示指纹确认，成功应回显：Welcome to GitLab, @root!

# 日常使用（注意 URL 里的端口号）
git clone ssh://git@gitlab.sakurain.net:2222/组/项目.git
```

把自己的公钥加到 GitLab（Preferences → SSH Keys）即可免密推拉。

> 若某些网络环境封锁高位端口，可后续把宿主机 22 让给 GitLab（系统 SSH 改到其他端口），属于进阶调整，不在本文范围。

## 8 已知坑与对策

|现象|原因与对策|
| ----------------------------------------------------| -----------------------------------------------------------------------------|
|容器反复重启 / OOMKilled|内存不足。`free -h` 确认，加 swap（见第 2 节）|
|登录后 422 / "The change you requested was rejected"|CSRF 信任链问题：① 确认 `X-Forwarded-Proto $scheme` 已传 ② 确认 `trusted_proxies` 覆盖了 proxy 网段（`docker network inspect proxy` 看 Subnet）③ `docker compose restart gitlab`|
|克隆地址是 `http://` 或端口不对|`external_url` 没写对或容器没重建：改 compose 后必须 `docker compose up -d` 重建而非 restart|
|页面样式全丢/资源 404|workhorse 8181 没配或 nginx `proxy_pass` 端口写错；`docker exec gitlab gitlab-ctl status` 逐项查|
|502 Bad Gateway|多半是 GitLab 还没 healthy（见 3.2 节，等！）；healthy 后仍 502 再查网络成员 `docker network inspect proxy`|
|push 大文件超时|`client_max_body_size` / `proxy_read_timeout` 是否生效；SSH 方式无此问题|
|升级后容器起不来|回滚镜像 tag 并 `docker compose up -d`；数据卷兼容大版本，跨大版本先备份|

## 9 日常维护

|事项|操作|
| --------------| -------------------------------------------------------------------|
|进入控制台排错|`docker exec -it gitlab bash` → `gitlab-ctl status` / `gitlab-ctl tail`|
|应用配置改动|改 compose 的 GITLAB_OMNIBUS_CONFIG 后 `docker compose up -d`（Omnibus 自动 reconfigure）|
|备份（重要！）|`docker exec gitlab gitlab-backup create`；备份文件在 `./data/backups/`，定期拷走|
|证书续期|无需改动——`renew.sh` 的 `certbot renew` 自动覆盖所有证书|
|升级|修改 compose 中的版本 tag → `docker compose pull && docker compose up -d`（跨大版本先看官方升级路径）|
|查看磁盘占用|GitLab 是磁盘大户：`du -sh /opt/gitlab/data` 定期盯|

---

## 版本说明

- GitLab：`gitlab/gitlab-ce:17.5.0-ce.0`（锁定版本，避免 latest 跨大版本炸数据；新版发布后以官方升级路径为准）
- 反代：GitLab workhorse 监听 8181（内置 nginx 关闭后的标准端口）
- Compose：V2 语法（无 `version:` 字段）

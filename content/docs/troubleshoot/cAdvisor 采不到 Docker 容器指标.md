# cAdvisor 采不到 Docker 容器指标

> 日期：2026-11-08
> 环境：Ubuntu 26.04 LTS ｜ Docker 29.7.2 ｜ containerd 2.3.3 ｜ Monitoring Stack（grafana.sakurain.net）
> 结论：cAdvisor 0.49.1 不认 Docker 29 的 containerd image store。**升级到  `v0.55.1`  一行改动解决，不需要任何额外参数。**
> 附带清掉了一批历史脏数据（64 位容器 ID 重复序列），并给 Prometheus 加了 admin API 用于删除。

---

## 1. 问题

Grafana 里 cAdvisor 的容器面板全空，但 Prometheus Targets 页面 `up{job="cadvisor"}` 一直是 1。

一开始容易被 Targets 绿色骗过去，以为采集正常。

---

## 2. 定位过程

### 2.1 先确认服务活着

```bash
docker ps --filter name=cadvisor
# Up 39 hours (healthy)  8080/tcp
```

容器 healthy，Prometheus 抓得到，所以不是网络或服务挂掉的问题。

### 2.2 再看指标到底有没有内容

```promql
count(container_last_seen)              → 52
count(container_last_seen{image!=""})   → 0     ← 关键
```

52 条看着挺好，但 `image` 标签全是空 —— 说明采到的全是宿主机 cgroup（`/YunJing`、`/system.slice/*.service`），一个 Docker 容器都没有。

**这一步是转折点。**  Targets 只告诉你"抓取成功"，不告诉你"抓到的东西有用"。以后遇到 exporter 相关的问题，都要拿实际查询验一下。

### 2.3 翻日志找原因

```bash
docker logs cadvisor --tail 20
```

刷屏：

```
E1108 04:37:31 manager.go:1116] Failed to create existing container:
  /system.slice/docker-<id>.scope: failed to identify the read-write layer ID
  for container "<id>".
  - open /rootfs/var/lib/docker/image/overlayfs/layerdb/mounts/<id>/mount-id:
    no such file or directory
```

每个容器每分钟重试一次，一直刷。

### 2.4 查这个路径到底存不存在

```bash
ls /var/lib/docker/image/
# identity-cache.db          ← 就一个文件，没有 overlayfs/layerdb
```

对比 Docker 的自报：

```bash
docker info | grep -A2 'Storage Driver'
# Storage Driver: overlayfs
#  driver-type: io.containerd.snapshotter.v1
```

**图形驱动显示  `overlayfs` ，但 driver-type 是 containerd snapshotter。**  这就是 Docker 29 的新默认行为：containerd image store 取代了旧版 graphdriver 布局，容器层搬到了：

```bash
ls /var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots | wc -l
# 141
```

旧路径 `layerdb/mounts/<id>/mount-id` 再也不会被创建了。

### 2.5 确认容器确实在 containerd 里

```bash
ctr namespaces ls
# moby           ← Docker 用的 namespace

ctr -n moby containers ls
# 13 个容器都在
```

到这儿根因清楚了：**cAdvisor 0.49.1 的 Docker factory 硬编码去读旧路径，Docker 29 已经没有那个路径了。**

---

## 3. 根因

### 3.1 Docker 29 改了存储布局

Docker 29 默认启用 containerd image store。旧版 graphdriver 的元数据目录 `/var/lib/docker/image/overlayfs/layerdb/` 不再创建，容器层的映射关系全在 containerd 的 snapshot store 里。

### 3.2 cAdvisor 0.49.1 的优先级问题

cAdvisor 启动时如果看到 `/var/run/docker.sock` 可达，**优先走 Docker factory**，而这个 factory 只会读旧路径。

关键坑：**没有开关能强制它降级 Docker factory、优先用 containerd factory。**  加了 containerd 相关参数也没用，Docker factory 优先级压着。

### 3.3 namespace 默认值也不对

就算切到 containerd 模式，cAdvisor 默认读 `k8s.io` namespace，而 Docker 的容器全在 `moby`。

这是上游已知问题，issue 一直开着：[cadvisor#3643](https://github.com/google/cadvisor/issues/3643)

---

## 4. 试错过程（记下来避免下次重走）

### 第一次尝试：只加参数，不升版本

改了 compose 加 `--containerd` + `--containerd-namespace=moby`，挂了 `/var/lib/containerd`。

**结果：失败。**  报错数量没变，`container_last_seen{image!=""}` 还是 0。

原因就是 3.2 说的：0.49.1 里 Docker factory 优先级太高，参数加了也不生效。

**教训：遇到"参数加了没反应"的时候，先怀疑是不是这个版本根本没走那条代码路径，而不是继续调参数。**

### 第二次尝试：升版本 + 加参数

镜像从 `v0.49.1` 升到 `v0.55.1`，参数和挂载保留。

**结果：部分成功，但引入了新问题。**  指标回来了，可 `name` 标签全变成了 64 位十六进制容器 ID，友好名（gitlab、nginx 这些）反而没了。

原因见下面 5.1：`--containerd` 参数把 containerd factory 提到前台，Docker factory 的数据被盖掉了。

### 第三次尝试：升版本，去掉 containerd 参数

只保留镜像升级到 `v0.55.1`，把 `--containerd` 和 `--containerd-namespace=moby` 两行删掉。

**结果：成功。**  友好名回来了，报错 0 条。

**结论：v0.55.1 本身已经修好了 Docker 29 兼容性，那两个参数是多余的。加了反而把 Docker factory 挤掉。**

---

## 5. 最终改动

`/opt/monitoring/docker-compose.yml` 的 cadvisor 段：

```yaml
  cadvisor:
    image: gcr.m.daocloud.io/cadvisor/cadvisor:v0.55.1   # ⚠️ 官方在 GCR，国内直连拉不动，用 daocloud 前缀
    container_name: cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    restart: unless-stopped
    networks: proxy
```

实际 diff 只有一行：

```diff
-    image: gcr.m.daocloud.io/cadvisor/cadvisor:v0.49.1
+    image: gcr.m.daocloud.io/cadvisor/cadvisor:v0.55.1
```

`/var/lib/containerd` 的挂载也去掉了 —— 走 Docker factory 不需要它。

### 5.1 为什么不能加 `--containerd`

这是这次排障最关键的教训。

cAdvisor 有多个 container factory：systemd、containerd、docker、crio、podman。它们各自扫描一遍，**谁后注册谁覆盖**。加 `--containerd` 之后 containerd factory 走上前台，它只能拿到容器 ID，拿不到 Docker 的容器名和 compose 标签，于是：

|指标|带 `--containerd`|不带（最终）|
| -----| ----------------| -------------|
|`name` 标签|64 位十六进制 ID|`gitlab`、`nginx` 这种友好名|
|`container_label_com_docker_compose_*`|全没有|有|
|`image` 标签|`docker.io/gitlab/gitlab-ce:latest`|`gitlab/gitlab-ce:latest`|

友好名那些标签是靠 Docker API 拿的，containerd factory 给不了。

**判断标准**：升级到 v0.55.x 之后如果指标已经正常，就别再画蛇添足加 containerd 参数。

### 版本锁定的选择

用**语义化版本 tag**（`v0.55.1`），不用 `latest`，也不需要 digest。

理由：tag 已足够锁住版本，可读性比 digest 好得多；以后升级直接改 tag 那一行就行，不用跑去查哈希。

---

## 6. 验证

```bash
docker ps --filter name=cadvisor
# Up 30 seconds (healthy)

docker logs cadvisor --since 60s 2>&1 | grep -c 'Failed to create existing container'
# 0
```

```promql
count by (name) (container_last_seen{name!=""})  → 12 个，全是友好名
up{job="cadvisor"}                               → 1
```

cAdvisor 自己吐的名字（`/metrics` 里 `name` 标签去重后）：

```
cadvisor  dsh  filecodebox  gitlab  gitlab-runner  grafana
memos  nginx  node-exporter  prometheus  registry  siyuan
```

版本确认：

```bash
docker exec cadvisor /usr/bin/cadvisor --version
# cAdvisor version v0.55.1 (f5bec374)

docker version --format '{{.Server.Version}}'
# 29.7.2
```

---

## 6.5 清理历史脏数据

前面的折腾在 Prometheus 里留下了一批 64 位 ID 的重复序列，会一直污染看板直到 15 天 retention 到期。直接删掉。

### 6.5.1 开 admin API

`delete_series` 需要 `--web.enable-admin-api`，默认是关的。在 `/opt/monitoring/docker-compose.yml` 的 prometheus 段加一行：

```yaml
  prometheus:
    command:
      - --config.file=/etc/prometheus/prometheus.yml
      - --storage.tsdb.retention.time=15d
      - --storage.tsdb.path=/prometheus
      - --web.enable-admin-api          # 删序列用，用完可以摘
```

```bash
cd /opt/monitoring && docker compose up -d prometheus
```

### 6.5.2 删除十六进制序列

```bash
docker exec prometheus wget -qO- --post-data='match%5B%5D=%7B__name__%3D~%22container_.%2A%22%2C+name%3D~%22%5B0-9a-f%5D%7B64%7D%22%7D' \
  'http://127.0.0.1:9090/api/v1/admin/tsdb/delete_series' -S
# HTTP/1.1 204 No Content
```

参数是 `match[]={__name__=~"container_.*", name=~"[0-9a-f]{64}"}`，URL 编码后塞进 POST body。

### 6.5.3 清理 tombstone

删完只是打标记，磁盘空间要 `clean_tombstones` 才释放：

```bash
docker exec prometheus wget -qO- --post-data='' \
  'http://127.0.0.1:9090/api/v1/admin/tsdb/clean_tombstones' -S
# HTTP/1.1 204 No Content
```

### 6.5.4 验证

```promql
count by (name) (container_last_seen)   → 只剩 12 个友好名，十六进制分组 0 个
```

**但删完发现变量下拉框还是列着那些容器 ID。**  原因见 6.6。

---

## 6.6 变量下拉框还残留容器 ID

`delete_series` 删的是**样本数据**，但 Grafana 的 `label_values` 读的是 Prometheus 的**倒排索引**。索引不重建，标签值就一直在。Prometheus 没有重建索引的接口，只能等 retention 过期或直接删数据块。

最快的办法是在 Grafana 变量上加 regex 过滤，不用等 15 天：

|变量|查询|regex|
| ----| ----| -----|
|`host`|`label_values({__name__=~"container.*"},instance)`|留空|
|`container`|`label_values({__name__=~"container.*", instance=~"$host"},name)`|`/^(?![0-9a-f]{64}$)(.+)$/`|

**regex 的语义坑**：Grafana 的变量 regex 是「**捕获组 1 的值就是保留值**」，不是「匹配到就保留」。所以必须用 `(.+)` 把整个值包起来，配合负向断言 `(?![0-9a-f]{64}$)` 排除 64 位十六进制。

写错了会怎样：`/^[^0-9a-f][^0-9a-f]*$/` 这种看着能排除十六进制，实际上会把 `dsh`、`gitlab` 这些以字母开头的名字也一起干掉。

改完 `container` 变量之后下拉框从 27 项减到 13 项，只剩友好名。

**注意**：变量 regex 和面板 PromQL 是两层，各自独立 —— 变量管下拉框显示什么，面板里的 `name!~"[0-9a-f]{64}"` 管图里画什么。两边都要改。

**另外**：admin API 常开会扩大攻击面。虽然是内网不可达，用完建议注释掉那行再重建一次。这次为了排障先留着。

---

## 7. 回滚

cadvisor 回滚：

```bash
cp /opt/monitoring/docker-compose.yml.bak.20261108b /opt/monitoring/docker-compose.yml
cd /opt/monitoring && docker compose up -d cadvisor
```

备份文件对照：

|文件|内容|
| ----| ---------------------------------------------------------|
|`docker-compose.yml.bak.20261108`|改动前原始状态（v0.49.1、无 command、无 containerd 挂载）|
|`docker-compose.yml.bak.20261108b`|带 `--containerd` 参数的中间版本|
|`docker-compose.yml.bak.prom20261108`|加 `--web.enable-admin-api` 之前的 prometheus 配置|

回滚到 `.bak.20261108` 后容器指标会重新变空，但监控栈本身不会挂，属于可接受的降级。

---

## 8. 知识库同步情况

对照思源《Monitoring Stack 容器化部署并配置 HTTPS》：

|位置|应该改成|
| -----------------------------| ----------------------------------|
|3.4 节 compose 的 cadvisor 段|`image` 改 `v0.55.1`；**不要加** `command` 段；**不要加** `/var/lib/containerd` 挂载|
|3.5 节手动拉取示例|`v0.49.1` → `v0.55.1`|
|7 节已知坑|新增"Docker 29 下容器指标为空"一条|
|版本说明|`cAdvisor v0.49.1` → `v0.55.1`|
|prometheus 段|视需要加 `--web.enable-admin-api`，并在文档里注明用完摘掉|

建议新增的已知坑条目：

> |现象|原因与对策|
> | --------------------------------------| --------------------------------------------------------------------------------------------------------------------------------------------------|
> |cAdvisor `up` 是 1 但容器看板全空，日志刷 `failed to identify the read-write layer ID`|Docker 29 起默认用 containerd image store，cAdvisor < 0.50 的 Docker factory 还在读已废弃的 `layerdb/mounts/<id>/mount-id`。**升到 v0.55.x 即可，不要额外加  `--containerd`  参数** —— 那会把 Docker factory 挤掉，`name` 标签退化成容器 ID|
> |cAdvisor `name` 标签变成 64 位十六进制|加了 `--containerd` / `--containerd-namespace=moby`。删掉这两个参数重建容器即可恢复友好名|

排查口诀：**Targets 绿了不代表指标有意义**，拿 `count(container_last_seen{image!=""})` 验证一下，返回 0 就是没采到容器。

---

## 9. 经验小结

1. **Targets 绿色 ≠ 数据正确。**  用实际 PromQL 验证，别只看 up。
2. **Docker 29 是个分水岭。**  所有读 `/var/lib/docker/image/*` 下 layerdb 的工具都会踩这个坑，不止 cAdvisor。
3. **参数没效果先怀疑版本。**  不是所有参数在所有版本都生效，尤其这种"工厂优先级"类的内部逻辑。
4. **日志里的  `no such file or directory`  要先去看那个路径是不是真的在。**  看一眼 `ls` 就能确定是"文件被删了"还是"从来没存在过"，两者修法完全不同。
5. **升级本身可能就够了，别急着加参数。**  这次的 containerd 参数纯粹是多余的，加了反而更糟。先验证最小改动能不能解决问题。
6. **cAdvisor 的 name 标签是判断走哪个 factory 的照妖镜。**  友好名 = Docker factory，十六进制 ID = containerd factory。
7. **删样本 ≠ 删索引。**  `delete_series` 只清时序数据，Prometheus 的倒排索引不跟着重建，`label_values` 照样能列出来。要在 Grafana 变量层再加一道 regex。

---

## 10. 参考资料

- [cadvisor#3643 — Add support for Docker with containerd-snapshotters](https://github.com/google/cadvisor/issues/3643)
- [Fix cAdvisor Containerd Namespace Mismatch with Docker 29](https://lucaberton.com/blog/docker-29-cadvisor-containerd-namespace-fix/)
- [Fix cAdvisor Docker 29 mount-id Errors](https://lucaberton.com/blog/fix-docker-containerd-failed-to-create-existing-container/)

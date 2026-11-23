# Monitoring Stack 容器化部署并配置 HTTPS

> 适用环境：Ubuntu 26.04 LTS ｜ Docker + Compose V2 ｜ Prometheus + Grafana + node_exporter + cAdvisor
> 域名：grafana.sakurain.net ｜ 数据面全部走 proxy 网络内网，不绕公网
> 前置：已按[《Nginx 容器化部署和使用》](/docs/deploy/nginx)部署好 nginx-proxy
> 注意：cAdvisor 镜像在 GCR，国内需 daocloud 前缀兜底

---

## 1 架构

```
                ┌─────────── proxy 网络（全部容器名互访）───────────┐
 node_exporter(9100)   cAdvisor(8080)   prometheus(9090)   grafana(3000)
     采宿主机指标        采容器指标        定期抓取两者           查Prometheus
                                                    │               ▲
浏览器 ──HTTPS──> nginx（grafana.sakurain.net）──────┴───────────────┘
                       （仅 Grafana 对外；Prometheus/exporter 不暴露公网）
```

- **四个服务一套 compose**：这是多服务编排——服务间用容器名互访，DNS 由 Docker 内嵌解析
- **只有 Grafana 配域名**——Prometheus 和 exporter 是纯内网组件，公网不可达（这是标准安全姿态：采集面不外露，展示面收口）
- 资源预算：全套约 500MB 内存、磁盘按 15 天留存约 1~2GB

## 2 前置检查

```bash
free -h          # 全套约 500MB 内存；若 GitLab 常驻且机器是 4G，先 docker stats 看一眼余量
df -h /opt       # Prometheus 时序数据会缓慢增长
```

## 3 部署监控栈

### 3.1 目录结构

按照以下结构创建目录 `mkdir -p /opt/monitoring/{prometheus,grafana/provisioning/datasources}`：

```
/opt/monitoring/
├── docker-compose.yml
├── prometheus/
│   └── prometheus.yml
└── grafana/
    └── provisioning/
        └── datasources/
            └── prometheus.yml        # 数据源声明式配置（IaC 小样板）
```

### 3.2 prometheus/prometheus.yml

```yaml
global:
  scrape_interval: 15s          # 抓取间隔
  evaluation_interval: 15s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: node-exporter     # 宿主机：CPU/内存/磁盘/网络
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: cadvisor          # 容器层面：每个容器的 CPU/内存/网络/磁盘
    static_configs:
      - targets: ["cadvisor:8080"]
```

### 3.3 grafana/provisioning/datasources/prometheus.yml

```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090      # 容器名互访，不绕公网
    isDefault: true
```

### 3.4 compose（/opt/monitoring/docker-compose.yml）

```yaml
services:
  node-exporter:
    image: prom/node-exporter:v1.8.2
    container_name: node-exporter
    command:
      - --path.procfs=/host/proc
      - --path.sysfs=/host/sys
      - --path.rootfs=/host
      - --collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/host:ro
    restart: unless-stopped
    networks: [proxy]

  cadvisor:
    # ⚠️ 官方在 GCR，国内直连拉不动，用 daocloud 前缀
    # ⚠️ 必须 ≥ v0.50：Docker 29 起默认用 containerd image store，
    #    老版本会去读已废弃的 /var/lib/docker/image/overlayfs/layerdb/mounts/<id>/mount-id，
    #    路径不存在 → 所有 Docker 容器建不出来 → 容器指标全空
    # ⚠️ 不要加 --containerd 参数：会把 Docker factory 挤掉，name 标签退化成 64 位容器 ID
    image: gcr.m.daocloud.io/cadvisor/cadvisor:v0.55.1
    container_name: cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    restart: unless-stopped
    networks: [proxy]

  prometheus:
    image: prom/prometheus:v2.54.1
    container_name: prometheus
    command:
      - --config.file=/etc/prometheus/prometheus.yml
      - --storage.tsdb.retention.time=15d      # 数据保留 15 天，控磁盘
      - --storage.tsdb.path=/prometheus
      # - --web.enable-admin-api        # 删除历史序列时才开，用完注释掉
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    restart: unless-stopped
    networks: [proxy]

  grafana:
    image: grafana/grafana:11.2.0
    container_name: grafana
    environment:
      TZ: Asia/Shanghai
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: <强密码>           # 首次登录用，登录后在界面改
      GF_USERS_ALLOW_SIGN_UP: "false"                # 关掉注册
      GF_SERVER_ROOT_URL: https://grafana.sakurain.net   # 生成外链/回调用
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
    restart: unless-stopped
    networks: [proxy]

volumes:
  prometheus-data:
  grafana-data:

networks:
  proxy:
    external: true
```

### 3.5 启动

```bash
# 按 3.1~3.4 写入文件后：
cd /opt/monitoring

# cAdvisor 镜像在 GCR，先单独拉（走 daocloud 前缀），其余走腾讯云 mirror
docker compose pull

docker compose up -d
docker compose ps          # 四个服务都 running 即过第一关
```

## 4 申请子域名证书

只有 Grafana 需要：

```bash
cd /opt/nginx-proxy
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d grafana.sakurain.net \
  --email wangyuyang2004@foxmail.com --agree-tos --no-eff-email
```

## 5 配置 nginx vhost 并生效

新建 `/opt/nginx-proxy/nginx/conf.d/grafana.sakurain.net.conf`：

```nginx
server {
    listen 80;
    server_name grafana.sakurain.net;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    http2 on;
    server_name grafana.sakurain.net;

    ssl_certificate     /etc/letsencrypt/live/grafana.sakurain.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/grafana.sakurain.net/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://grafana:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;                     # Grafana 生成外链靠它
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;          # Grafana Live 实时功能
        proxy_set_header Connection "upgrade";
    }
}
```

重载配置文件：

```bash
docker compose exec nginx nginx -t && docker compose exec nginx nginx -s reload
```

## 6 访问与出图

1. 打开 `https://grafana.sakurain.net`，用 compose 里的 admin 密码登录
2. **数据源已自动配好**（provisioning 文件生效）——左侧 Connections → Data sources → Prometheus 显示绿色 Healthy，这就是声明式配置的价值：重装不会丢失
3. **出第一张看板**（30 秒）：
   - 左侧 **Dashboards → Import**
   - 输入 ID **`1860`**（node_exporter 全量看板，社区最流行）或 `16098` （著名的中文看板），点 Load → 数据源选 Prometheus → Import
   - 宿主机 CPU/内存/磁盘/网络全出来了
4. cAdvisor 看板：在 grafana.com/dashboards 搜 "cAdvisor" 选星标最高的导入（容器视角）
5. 顺手把这套 provisioning 目录和 compose 提交进 Git——**这就是 IaC 的第一块真实资产**

## 7 已知坑与对策

|现象|原因与对策|
| ------------------------------------------------| ------------------------------------------------------------------------------------------------------------------------------------------|
|`docker compose pull` 卡死 cadvisor|GCR 被墙是预期行为，确认前缀是 `gcr.m.daocloud.io/`；还不行就 `docker pull gcr.m.daocloud.io/cadvisor/cadvisor:v0.55.1` 手动拉|
|Prometheus UI（容器内）Targets 全红|服务名写错或没都在 proxy 网络：`docker network inspect proxy` 核对成员；prometheus.yml 里的 targets 与容器名逐字对齐|
|node-exporter 磁盘指标为空|新版需要 `--path.rootfs=/host` + `-v /:/host:ro`（本文已含），老教程的挂法在新版会缺数据|
|Grafana 数据源红色 Error|provisioning 里的 `url: http://prometheus:9090` 拼错，或 prometheus 容器没起来|
|Grafana 忘记 admin 密码|改 compose 的 `GF_SECURITY_ADMIN_PASSWORD` 重建容器（dashboard 数据在卷里，不丢）|
|登录后跳转 http/外链报错|`GF_SERVER_ROOT_URL` 没配或协议不对|
|Prometheus 磁盘膨胀|`--storage.tsdb.retention.time=15d` 控住；或缩短到 7d|
|页面"保存 dashboard"提示权限|以 admin 登录；provisioning 导入的看板是只读，要改就"另存为"|
|cAdvisor `up` 是 1 但容器看板全空，日志刷 `failed to identify the read-write layer ID`|Docker 29 起默认用 containerd image store，cAdvisor < v0.50 的 Docker factory 还在读已废弃的 `layerdb/mounts/<id>/mount-id`。**升到 v0.55.x 即可，不要额外加 `--containerd` 参数**|
|cAdvisor `name` 标签变成 64 位十六进制|加了 `--containerd` / `--containerd-namespace=moby`，containerd factory 把 Docker factory 挤掉了。删掉这两个参数重建容器即可恢复友好名|
|看板里混着十六进制 ID 和老友好名的重复序列|重建容器留下的历史脏数据。开 `--web.enable-admin-api`，用 `POST /api/v1/admin/tsdb/delete_series` 删 `{__name__=~"container_.*", name=~"[0-9a-f]{64}"}`，再 `clean_tombstones` 释放空间。**注意这只清样本，倒排索引里的标签值还在**，见下两条|
|`delete_series` 删了但变量下拉框还列着那些容器 ID|`label_values` 读的是 Prometheus 倒排索引，`delete_series` 只打样本 tombstone，索引不重建。Prometheus 没有重建索引的接口，只能等 retention 过期或删块。**最快办法是在 Grafana 变量上加 regex**：`/^(?![0-9a-f]{64}$)(.+)$/`|
|变量和面板要分别处理，改一遍不够|两层独立：变量 regex 管下拉框显示什么，面板 PromQL 里的 `name!~"[0-9a-f]{64}"` 管图里画什么。**两边都要改**|
|时区差 8 小时|Grafana 界面 Profile → 时区选 Asia/Shanghai；compose 已设 TZ|

### 7.1 Grafana 看板变量配置（Cadvisor exporter）

社区导入的 cAdvisor 看板（如 `Cadvisor exporter`）有两个变量，`container` 需要加一层过滤，否则下拉框会混进 64 位容器 ID。

|变量|查询|regex|
| ------| ------| -------|
|`host`|`label_values({__name__=~"container.*"},instance)`|留空|
|`container`|`label_values({__name__=~"container.*", instance=~"$host"},name)`|`/^(?![0-9a-f]{64}$)(.+)$/`|

regex 的写法要点：Grafana 的变量 regex 是「**捕获组 1 的值就是保留值**」的语义，所以必须用 `(.+)` 把整个值包起来，配合负向断言 `(?![0-9a-f]{64}$)` 排除 64 位十六进制。

改完之后，六个面板的 PromQL 还要单独加 `name!~"[0-9a-f]{64}"` —— **变量和面板是两层，改一遍不够**。改面板时注意 `container_start_time_seconds` 这类指标如果只存在于 ID 序列上，加了过滤会变成 No data，要确认那个指标在友好名序列上也有。

## 8 日常维护

|事项|操作|
| --------| ---------------------------------------------------------------------------------------------------------------------------|
|证书续期|`renew.sh` 自动覆盖|
|备份什么|Prometheus 时序数据**不值得备份**（监控数据丢了重采即可）；要备份的是 `grafana-data`（看板）和整个 `/opt/monitoring` 配置目录（compose + prometheus.yml + provisioning）|
|看板备份|除 provisioning 外，手工改的看板：Dashboard 设置 → JSON Model 导出，存进 Git|
|升级|四个镜像一起 `docker compose pull && docker compose up -d`；Prometheus 大版本升级先看 changelog|
|磁盘监控|`du -sh /var/lib/docker/volumes/monitoring_prometheus-data`|
|进阶预告|阶段二给 AutoOps 加 `/metrics` 后，在 prometheus.yml 里加一段 scrape_config 即可纳入监控——同一个文件，同一个套路|

## 9 安全清单

- [ ] 四个容器**没有一个**映射宿主机端口（`docker ps` 确认——exporter 和 prometheus 公网零可达）
- [ ] Grafana admin 密码已改且非弱口令
- [ ] 注册已关闭（GF_USERS_ALLOW_SIGN_UP=false）
- [ ] 只有 grafana.sakurain.net 一个对外域名
- [ ] `prometheus.yml` 与 provisioning 目录可进 Git（无敏感信息）；Grafana 密码不进 Git
- [ ] 内地节点域名备案有效

---

## 版本说明

- node_exporter `v1.8.2` ｜ cAdvisor `v0.55.1`（GCR，经 daocloud 镜像拉取）｜ Prometheus `v2.54.1` ｜ Grafana `11.2.0`
- 编排：四个服务一套 compose，全部加入外部 proxy 网络，服务名即 DNS——多服务编排的第一课
- 数据源：Grafana provisioning 声明式挂载，重建容器自动恢复（对比手点 UI 配置，这是 IaC 范式）
- 出图：node_exporter 看板 ID **1860**；cAdvisor 看板在 grafana.com 按星标选用
- Compose：V2 语法（无 `version:` 字段）
- 宿主机 Docker 29.7.2 + containerd 2.3.3，默认 containerd image store；**cAdvisor 必须 ≥ v0.50**，且**不要加 `--containerd` 参数**（会把 name 标签退化成容器 ID）

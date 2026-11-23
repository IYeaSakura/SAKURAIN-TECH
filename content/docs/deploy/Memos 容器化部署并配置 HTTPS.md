# Memos 容器化部署并配置 HTTPS

> 环境：Ubuntu 26.04 LTS ｜ Docker + Compose V2 ｜ Memos（官方单容器版）
> 域名：memos.sakurain.net ｜ 镜像：neosmemo/memos（Docker Hub，走腾讯云 mirror 拉取）
> 前置：已按[《Nginx 容器化部署和使用》](/docs/deploy/nginx)部署好 nginx-proxy

---

## 1 架构

```
浏览器/App ──HTTPS──> nginx（80/443，memos.sakurain.net 的 server block）
                          │ proxy_pass http://memos:5230（proxy 网络，容器名互访）
                          ▼
                   memos 容器（不映射宿主机端口；SQLite 单容器，镜像仅 ~22MB）
```

- 与 DSH/GitLab 同一套反代模式：nginx 独占入口，memos 只在 proxy 网络内可达
- Memos 自带注册登录体系，不需要 Basic Auth
- 资源占用极低（内存约 50MB），和 DSH/GitLab 不抢资源，可常开

## 2 前置检查

```bash
# 域名 A 记录：memos → 服务器公网 IP
dig +short memos.sakurain.net

# 磁盘顺手看一眼（SQLite + 附件会缓慢增长）
df -h /opt
```

镜像走已配置的腾讯云 mirror：`neosmemo/memos` 是 Docker Hub 官方命名空间，mirror.ccs.tencentyun.com 自动代理；**不要换成 ghcr.io 前缀**（GHCR 在国内无镜像加速，拉不动）。

## 3 部署 Memos

### 3.1 目录与 compose（/opt/memos/docker-compose.yml）

```yaml
services:
  memos:
    image: neosmemo/memos:stable          # stable=当前稳定线；追求可复现可锁具体版本号（以 GitHub Releases 为准）
    container_name: memos
    environment:
      TZ: Asia/Shanghai
      MEMOS_MODE: prod
      MEMOS_PORT: 5230
      MEMOS_INSTANCE_URL: "https://memos.sakurain.net"   # ← 关键：分享链接/附件外链按这个地址生成
    volumes:
      - ./data:/var/opt/memos             # SQLite 库 + 上传附件，全在这一个目录
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5230/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    logging:                               # 防止日志吃满磁盘
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    networks:
      - proxy

networks:
  proxy:
    external: true
```

### 3.2 启动

```bash
mkdir -p /opt/memos/data && cd /opt/memos

# ⚠️ Memos 容器以 UID 10001（非 root）运行，宿主目录必须先改属主
chown -R 10001:10001 /opt/memos/data

docker compose up -d
docker compose ps                # (healthy) 即就绪，Memos 启动飞快（秒级，无 GitLab 的漫长等待）
```

## 4 申请子域名证书

老流程（default.conf 的 `server_name _` 通配兜住 ACME 验证）：

```bash
cd /opt/nginx-proxy
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d memos.sakurain.net \
  --email wangyuyang2004@foxmail.com --agree-tos --no-eff-email
```

## 5 配置 nginx vhost 并生效

新建 `/opt/nginx-proxy/nginx/conf.d/memos.sakurain.net.conf`：

```nginx
server {
    listen 80;
    server_name memos.sakurain.net;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    http2 on;
    server_name memos.sakurain.net;

    ssl_certificate     /etc/letsencrypt/live/memos.sakurain.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/memos.sakurain.net/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # ── 2026 年 XSS 漏洞（CVE-2026-30586）的官方推荐缓解：代理层加 CSP ──
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer" always;

    client_max_body_size 50m;            # 笔记附件上限，按需调整

    location / {
        proxy_pass http://memos:5230;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;        # Memos 有实时推送，WebSocket/SSE 需要
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
    }
}
```

```bash
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

## 6 访问与首次配置

浏览器打开 `https://memos.sakurain.net`：

1. **首个注册的账号自动成为管理员**——注意：任何能打开这个页面的人都能抢注！所以注册完第一件事是去后台关掉注册
2. 进入后：头像 → **设置 → 系统 / System** → 关闭"允许新用户注册"（Allow user registration）
3. 界面语言跟随浏览器自动切换中文，无需手动设置
4. 写一条测试 memo，点分享，确认生成的链接是 `https://memos.sakurain.net/...`——如果不是，`MEMOS_INSTANCE_URL` 没生效，重建容器

## 7 已知坑与对策

|现象|原因与对策|
| -------------------------------------| -----------------------------------------------------------|
|启动即 EACCES / permission denied|宿主 data 目录属主不对：**必须  `chown -R 10001:10001`**（Memos 是 10001，不是常见的 1000）|
|分享链接/附件地址是 localhost 或 http|`MEMOS_INSTANCE_URL` 没配或协议不对，改后 `docker compose up -d` 重建|
|首次打开被别人抢注了管理员|公网部署窗口期内任何人都可注册首号。补救：删库重来——`docker compose down && rm -rf data/* && chown -R 10001:10001 data && docker compose up -d`|
|附件上传 413|`client_max_body_size` 太小，调大后 reload|
|反代后实时更新不推送|缺 `Upgrade`/`Connection` 头，见 vhost 第 6 节|
|F12 有 Mixed Content 警告|页面 https 但资源 http——检查 `MEMOS_INSTANCE_URL` 是否为 https|
|数据库 locked / 损坏|多见于不当中断。备份恢复见第 8 节|

## 8 日常维护

|事项|操作|
| ------------| ---------------------------------------------------------|
|备份（每周）|数据全部在 `./data/memos_prod.db`（SQLite 单文件）+ 附件。最稳的方式：<br />`cd /opt/memos && docker compose stop && tar -czf backup-$(date +%F).tar.gz data && docker compose start`|
|证书续期|无需改动——`renew.sh` 自动覆盖所有证书|
|升级|`docker compose pull && docker compose up -d`（SQLite 自动迁移；跨版本升级前先看 Releases 说明并备份）|
|查看日志|`docker compose logs -f memos`|
|磁盘监控|`du -sh /opt/memos/data`——附件是大头|

---

## 版本说明

- Memos：`neosmemo/memos:stable`（stable 标签跟随当前稳定线；本文验证时最新稳定系为 0.30.x，生产建议以 GitHub Releases 页面为准锁定具体版本号）
- 容器身份：UID/GID 10001（非 root 运行）
- 存储：SQLite 单文件（`memos_prod.db`），无需外置数据库；高并发团队场景可切 MySQL/PostgreSQL（`MEMOS_DRIVER` + `MEMOS_DSN`）
- Compose：V2 语法（无 `version:` 字段）

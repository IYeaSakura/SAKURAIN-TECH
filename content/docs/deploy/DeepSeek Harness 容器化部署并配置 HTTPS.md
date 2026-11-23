# DeepSeek Harness 容器化部署并配置 HTTPS

> 域名：harness.sakurain.net ｜ 镜像：runzhliu/deepseek-harness:0.2.2-alpha.2-r1
> 前置：已按[《Nginx 容器化部署和使用》](/docs/deploy/nginx)部署好 nginx-proxy（80/443 由 nginx 独占）

---

## 1 架构

```
浏览器 ──HTTPS──> nginx（80/443，已有 harness.sakurain.net 的 server block）
                     │ proxy_pass http://dsh:3080（proxy 网络，容器名互访）
                     ▼
              dsh 容器（不映射任何宿主机端口，公网零直达）
```

- 服务不占用 80/443，也不占用宿主机端口——对外只有 nginx 一个入口
- 双重鉴权：nginx Basic Auth（域名级密码） + DSH 自带 ?token=（应用级）
- noVNC（6080）不发布，杜绝无登录桌面泄露

## 2 前置检查

```bash
# 域名 A 记录：harness → 服务器公网 IP，验证解析
dig +short harness.sakurain.net
# ⚠️ 内地节点需确认 sakurain.net 备案覆盖本机，否则 80/443 被拦
```

## 3 部署 DeepSeek Harness

### 3.1 /opt/deepseek-harness/compose.yaml

```yaml
services:
  deepseek-harness:
    image: runzhliu/deepseek-harness:0.2.2-alpha.2-r1
    container_name: dsh
    shm_size: "1gb"
    environment:
      - TZ=Asia/Shanghai
    command:
      - "web"
      - "--patch"
      - "/opt/deepseek-harness/web.cordis.patch.yml"
      - "--no-open"
      - "--public-url"
      - "https://harness.sakurain.net/"
      - "--trusted-host"
      - "harness.sakurain.net"
    volumes:
      - /dsh-home:/home/node/.dsh
      - ./workspace:/workspace
    restart: unless-stopped
    networks:
      - proxy

volumes:
  dsh-home:

 networks:
	proxy: true
```

### 3.2 启动

```bash
# 将 dsh-home 和 workspace 目录及其内容的所有者改为 UID 1000
sudo chown -R 1000:1000 /dsh-home
sudo chown -R 1000:1000 /opt/deepseek-harness/workspace

docker compose up -d
docker compose ps             # 冷启动 1~2 分钟，等 healthy
docker compose logs --no-color deepseek-harness | grep 'dsh web:'
```

**记录日志里  `?token=...`  的 token，重建容器会变。**

镜像约 3.65GB（含 Chromium）；**内存建议 4G 起步**。若拉取失败（Docker Hub 不通），用前缀手动拉取再 retag：

```bash
docker pull docker.m.daocloud.io/runzhliu/deepseek-harness:0.2.2-alpha.2-r1
docker tag docker.m.daocloud.io/runzhliu/deepseek-harness:0.2.2-alpha.2-r1 \
           runzhliu/deepseek-harness:0.2.2-alpha.2-r1
```

## 4 申请子域名证书

default.conf 的 `server_name _` 通配已能兜住 ACME 验证，直接签发：

```bash
cd /opt/nginx-proxy
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d harness.sakurain.net \
  --email wangyuyang2004@foxmail.com --agree-tos --no-eff-email
```

## 5 配置 Basic Auth 密码验证

DSH 是**可执行 shell 的 Agent 运行时且处于开发者预览阶段**，公网暴露必须加域名级密码，与 DSH token 形成双因子。

### 4.1 生成密码文件

```bash
apt install -y apache2-utils
mkdir -p /opt/nginx-proxy/nginx/auth
htpasswd -bc /opt/nginx-proxy/nginx/auth/.htpasswd-dsh <你的用户名> <强密码>
chmod 644 /opt/nginx-proxy/nginx/auth/.htpasswd-dsh
```

后续加用户：去掉 `-c`（否则覆盖已有文件）

```bash
htpasswd -b /opt/nginx-proxy/nginx/auth/.htpasswd-dsh <新用户> <密码>
```

### 4.2 挂载进 nginx 容器

编辑 `/opt/nginx-proxy/docker-compose.yml`，给 nginx 服务加一条只读挂载：

```yaml
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/auth:/etc/nginx/auth:ro      # ← 新增：Basic Auth 密码文件
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
```

重建 nginx 使挂载生效：

```bash
cd /opt/nginx-proxy
docker compose up -d          # 会重建容器以应用新挂载，几秒的事
```

## 6 配置 nginx vhost 并生效

新建 `/opt/nginx-proxy/nginx/conf.d/harness.sakurain.net.conf`：

```nginx
server {
    listen 80;
    server_name harness.sakurain.net;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    http2 on;
    server_name harness.sakurain.net;

    ssl_certificate     /etc/letsencrypt/live/harness.sakurain.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/harness.sakurain.net/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # ── Basic Auth：域名级密码验证 ──
    auth_basic "dsh restricted";
    auth_basic_user_file /etc/nginx/auth/.htpasswd-dsh;

    location / {
        proxy_pass http://dsh:3080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;      # WebSocket 必需
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;                    # Agent 长任务
    }
}
```

```bash
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

## 7 访问与首次配置

浏览器打开：

```
https://harness.sakurain.net/?token=<第三步日志中的token>
```

1. 浏览器先弹 Basic Auth 窗口 → 输入第五步设置的 用户名/密码
2. 通过后进入 DSH 界面，首次使用在设置页配置 API Key（也可启动容器时传 `DEEPSEEK_API_KEY` 环境变量）

## 8 已知坑与对策

|现象|原因与对策|
| -----------------------| -------------------------------------------------------------------|
|"选择工作区" 403|上游目录选择器钉在 loopback。解法：`ssh -L 3080:127.0.0.1:3080 root@<服务器>`，访问 `http://localhost:3080/?token=...` 操作|
|WebSocket 断连/页面转圈|检查 vhost 的 `Upgrade`/`Connection` 头与 `proxy_read_timeout` 是否写入|
|Basic Auth 弹窗不出现|确认 nginx 已重建（新挂载）+ reload；确认 `.htpasswd-dsh` 权限 600 且路径是容器内 `/etc/nginx/auth/`|
|502 Bad Gateway|dsh 未加入 proxy 网络 / 未启动 / `proxy_pass` 端口写错；`docker network inspect proxy` 核对成员|
|token 失效|容器重建后 token 会变，重新 `docker compose logs` 获取|

## 9 日常维护

|事项|操作|
| ----------| ------------------------------------------------------------|
|证书续期|无需改动——`renew.sh` 的 `certbot renew` 自动覆盖所有证书|
|升级镜像|改 compose.yaml 版本号 → `docker compose pull && docker compose up -d`（会话数据在卷里，不会丢失）|
|查看日志|`docker compose -f /opt/dsh/compose.yaml logs -f`|
|改密码|重新 `htpasswd -b` 写入后无需 reload（nginx 每次请求都读文件）|

# Nginx 容器化部署和使用

> 环境：Ubuntu 26.04 LTS ｜ Docker + Compose V2 ｜ Nginx 稳定版 + Certbot 官方镜像

---

## 1 前置条件检查

### 1.1  域名解析

在域名服务商控制台添加 A 记录：

```
主机记录: @ 或 www 或 app        # 按子域名需求
记录类型: A
记录值:   <你的服务器公网 IP>
TTL:      600
```

验证解析生效（本地执行）：

```bash
dig +short your.domain.com        # 应返回服务器公网 IP
```

### 1.2 云安全组放行

云控制台 → 轻量服务器 → 防火墙，放行：

|端口|用途|
| ------| --------------------------|
|22|SSH（建议限制为常用 IP）|
|80|HTTP / ACME 验证|
|443|HTTPS|

> ⚠️ 轻量服务器是**双层防火墙**：云控制台防火墙 + 系统内 ufw，两层都要放行。

### 1.3 备案提醒

- **内地节点**：域名指向内地服务器提供网站服务必须先完成 ICP 备案（约 1~2 周），未备案 80/443 会被拦截
- 等备案期间可先用 IP + mkcert 自签证书跑通流程，备案通过后再换正式证书
- **香港/境外节点**：免备案

---

## 2 安装 Docker 与 Compose 插件

## 2.1 配置阿里云镜像源

**1.安装必要依赖**

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release
```

**2. 创建密钥目录并导入阿里云 GPG 密钥**

bash

```bash
# 创建存放密钥的目录
sudo mkdir -p /etc/apt/keyrings

# 下载并导入阿里云的 Docker GPG 密钥
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
```

**3. 添加阿里云 Docker 软件源**
这条命令会自动识别系统架构和 Ubuntu 版本代号，并将阿里云源写入配置文件。

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

**4. 更新软件包列表**

```bash
# 更新 apt 缓存，使其识别新添加的阿里云源
sudo apt-get update
```

## 2.2 安装 Docker 相关组件

```bash
# 安装 Docker 引擎及相关组件
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker 服务并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户加入 docker 组（免 sudo，重新登录生效）
sudo usermod -aG docker $USER

# 验证安装，如果输出版本号即代表成功
docker --version
```

---

## 3 目录结构与 Compose 文件

### 3.1 目录结构（整个目录就是未来进 Git 的 IaC 单元）

```
nginx-proxy/
├── docker-compose.yml
├── nginx/
│   └── conf.d/
│       ├── default.conf          # HTTP + ACME 验证
│       └── your.domain.com.conf  # HTTPS 站点（第 6 步生成）
├── certbot/
│   ├── conf/                     # 证书与账户数据（敏感，不进 Git）
│   └── www/                      # ACME 验证文件
└── logs -> /var/log/nginx        # 可选：日志软链
```

### 3.2 docker-compose.yml

创建 `docker-compose.yml` 文件：

```bash
vim /opt/nginx-proxy/docker-compose.yml
```

写入内容为：

```yaml
services:
  nginx:
    image: nginx:1-alpine
    container_name: nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    networks:
      - proxy

  certbot:
    image: certbot/certbot
    container_name: certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot

networks:
  proxy:
    name: proxy
```

### 3.3 nginx/conf.d/default.conf（HTTP 阶段）

创建相关路径和 `default.conf` 配置文件：

```bash
mkdir -p /opt/nginx-proxy/nginx/conf.d /opt/nginx-proxy/certbot/conf certbot/www
vim /opt/nginx-proxy/nginx/conf.d/default.conf
```

写入内容为：

```nginx
server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'nginx is up\n';
        add_header Content-Type text/plain;
    }
}
```

---

## 4 启动 Nginx（HTTP 阶段）

## 4.1 配置腾讯云 Docker 镜像源

```bash
# 1. 配置镜像加速器
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.m.daocloud.io"
  ]
}
EOF

# 2. 重启 Docker
systemctl restart docker

# 3. 验证镜像源生效
docker info | grep -A 5 "Registry Mirrors"d
```

## 4.2 启动 Nginx

```bash
cd /opt/nginx-proxy
docker compose up -d
docker compose ps              # nginx 应为 running
curl http://127.0.0.1          # 本机自测
curl http://<你的域名>          # 解析生效后域名自测
```

**常见失败：**

- `curl: (7) Connection refused` → 容器没起来，`docker compose logs nginx` 看报错
- 本机通、外网不通 → 大概率是云防火墙没放行 80 端口

---

## 5 申请 Let's Encrypt 证书

### 5.1 预置占位证书（关键，否则后面配置引用不存在的证书会导致 nginx 启动失败）

```bash
docker compose run --rm --entrypoint " \
  mkdir -p /etc/letsencrypt/live/your.domain.com && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/your.domain.com/privkey.pem \
    -out /etc/letsencrypt/live/your.domain.com/fullchain.pem \
    -subj '/CN=localhost' \
" certbot
```

### 5.2 确认 80 端口的 ACME 验证可达

```bash
echo "test-content" > certbot/www/test.txt
curl http://your.domain.com/.well-known/acme-challenge/../test.txt
# 注：nginx 的 location 已把 acme-challenge 指到 /var/www/certbot，
# 上面这条用来确认 80 → nginx → 目录 链路畅通（测试后删除 test.txt）
```

### 5.3 webroot 方式申请真实证书

```bash
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d your.domain.com \
  --email you@example.com \
  --agree-tos --no-eff-email
```

输出 `Successfully received certificate` 即成功。证书落在 `./certbot/conf/live/your.domain.com/`：

|文件|用途|
| ----| ---------------------------------|
|`fullchain.pem`|证书链（含中间证书），给 nginx 用|
|`privkey.pem`|私钥|

> ⚠️ **频率限制**：同一域名每周最多失败/成功申请 5 次，调试用 `--dry-run`（不计入限制），别滥用 `--force-renewal`。

---

## 6 配置 HTTPS 站点

创建 `nginx/conf.d/your.domain.com.conf`：

```nginx
# HTTP：ACME 验证 + 跳转 HTTPS
server {
    listen 80;
    server_name your.domain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl;
    http2 on;
    server_name your.domain.com;

    ssl_certificate     /etc/letsencrypt/live/your.domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your.domain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # 临时占位，反代时替换下面的 return
    location / {
        return 200 'hello, https works\n';
        add_header Content-Type text/plain;
    }
}
```

生效（每次改配置都走这两步，已成肌肉记忆）：

```bash
docker compose exec nginx nginx -t                    # 先校验，Syntax OK 再继续
docker compose exec nginx nginx -s reload             # 热加载，不中断连接
```

验证：

```bash
curl -I https://your.domain.com        # HTTP/2 200
# 浏览器访问应显示小锁；SSL Labs 评分可跑 https://www.ssllabs.com/ssltest/
```

---

## 7 配置自动续期

Let's Encrypt 证书有效期 90 天且官方已公布逐步缩短计划，**自动化续期是必需不是可选**。

创建自动化续期脚本 `renew_encrypt.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /opt/nginx-proxy
docker compose run --rm certbot renew --quiet
docker compose exec nginx nginx -s reload
```

添加定时任务，`/home/<user>/nginx-proxy/renew_encrypt.sh` 替换为脚本的实际路径：

```bash
chmod +x renew_encrypt.sh
crontab -e
# 添加（每周日凌晨 3 点检查，证书不足 30 天才会真正续期）：
0 3 * * 0 /home/<user>/nginx-proxy/renew_encrypt.sh >> /var/log/certbot-renew.log 2>&1
```

手动验证续期链路（不计入频率限制）：

```bash
docker compose run --rm certbot renew --dry-run
```

---

## 8 反代后续服务（标准流程）

以后每加一个服务（GitLab、Grafana、registry……），三步：

**1. 服务加入 proxy 网络。**  在该服务的 compose 里：

```yaml
networks:
  - proxy

networks:
  proxy:
    external: true        # 引用已存在的外部网络
```

**2. 复制站点配置并改  `proxy_pass`**（用容器名解析，不用 IP）：

```nginx
location / {
    proxy_pass http://gitlab:3000;                 # 服务名:容器内端口
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**3. 校验并热加载**：

```bash
docker compose exec nginx nginx -t && docker compose exec nginx nginx -s reload
```

---

## 9 日常运维命令速查

|操作|命令|
| ------------| ----|
|查看日志|`docker compose logs -f nginx`|
|改配置后校验|`docker compose exec nginx nginx -t`|
|热加载|`docker compose exec nginx nginx -s reload`|
|查看证书信息|`openssl x509 -in certbot/conf/live/<域名>/cert.pem -noout -dates`|
|重启全部|`docker compose restart`|
|进入容器排错|`docker compose exec nginx sh`|

---

## 10 故障排查清单

|症状|排查顺序|
| -----------------------| ------------------------------------------------------------|
|外网访问不通|① 云防火墙 ② ufw ③ 容器 `docker compose ps` ④ `curl 127.0.0.1` 定位层级|
|域名不通 IP 通|DNS 未生效（`dig +short` 确认）；内地节点查备案状态|
|ACME 验证失败 404|`certbot/www/.well-known/acme-challenge/` 文件能否经 80 端口 curl 到；nginx 是否 reload 过|
|ACME 验证失败 403|webroot 目录权限（宿主机目录需容器 www-data 可读，至少 755）|
|nginx 启动报证书找不到|第 5 步的占位证书没做，或路径少了一层 `live/<域名>/`|
|改配置后 502|后端服务没起、不在 proxy 网络、或 `proxy_pass` 端口写错|
|证书申请提示 rate limit|等 7 天；以后调试一律 `--dry-run`|

---

## 版本说明

- Nginx：官方 `nginx:1-alpine`（稳定线， alpine 小镜像）
- Certbot：官方 `certbot/certbot` 镜像
- Compose：V2 语法（无 `version:` 字段；使用 `docker compose` 子命令）
- HTTP/2：`http2 on;` 新指令（`listen 443 ssl http2` 写法已废弃）

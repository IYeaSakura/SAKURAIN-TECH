# FileCodeBox 容器化部署并配置 HTTPS

> 适用环境：Ubuntu 26.04 LTS ｜ Docker + Compose V2 ｜ FileCodeBox（vastsa/FileCodeBox 官方镜像）
> 域名：fcb.sakurain.net ｜ 镜像：lanol/filecodebox:latest
> 前置：已按[《Nginx 容器化部署和使用》](/docs/deploy/nginx)部署好 nginx-proxy

---

## 1 架构

```
浏览器 ──HTTPS──> nginx（80/443，fcb.sakurain.net）
                     │ proxy_pass http://filecodebox:12345（proxy 网络，容器名互访）
                     ▼
              filecodebox 容器（不映射宿主机端口；数据在命名卷 fcb-data：
                              SQLite 库 + 上传文件 + .env2 应用配置）
```

- FileCodeBox = FastAPI + SQLite + Vue3，轻量单容器；匿名取件码分享，自带管理后台
- **v2.x 的应用配置（标题/上传大小/管理密码）全部在管理后台 UI 里改**，持久化在数据卷的 `.env2` 文件

## 2 前置检查

```bash
dig +short fcb.sakurain.net        # A 记录指向服务器
free -h                            # 很轻，顺手看一眼
```

## 3 部署 FileCodeBox

### 3.1 compose（/opt/filecodebox/docker-compose.yml）

```yaml
services:
  filecodebox:
    image: lanol/filecodebox:latest
    container_name: filecodebox
    restart: unless-stopped
    environment:
      - APP_ENV=production
      - WORKERS=1
      - LOG_LEVEL=warning
      - ACCESS_LOG=false
    volumes:
      - fcb-data:/app/data:rw
    # ports 整段删除——官方默认映射 12345 到宿主机，本基础设施统一走 nginx 反代
    networks:
      - proxy
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  fcb-data:

networks:
  proxy:
    external: true
```

### 3.2 启动

```bash
mkdir -p /opt/filecodebox && cd /opt/filecodebox
docker compose up -d
docker compose ps
docker compose logs -f filecodebox     # 无异常刷出即可（FastAPI 启动很快）
```

## 4 申请子域名证书

```bash
cd /opt/nginx-proxy
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d fcb.sakurain.net \
  --email wangyuyang2004@foxmail.com --agree-tos --no-eff-email
```

## 5 配置 nginx vhost 并生效

新建 `/opt/nginx-proxy/nginx/conf.d/fcb.sakurain.net.conf`：

```nginx
server {
    listen 80;
    server_name fcb.sakurain.net;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    http2 on;
    server_name fcb.sakurain.net;

    ssl_certificate     /etc/letsencrypt/live/fcb.sakurain.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fcb.sakurain.net/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    client_max_body_size 2g;              # 要和后台 uploadSize 匹配：nginx 层 ≥ 应用层
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;

    location / {
        proxy_pass http://filecodebox:12345;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;              # 大文件直传更稳
    }
}
```

```bash
docker compose exec nginx nginx -t && docker compose exec nginx nginx -s reload
```

## 6 访问与首次配置

1. 打开 `https://fcb.sakurain.net`——**新版（v2.x）首次访问会引导初始化设置管理员密码**；若直接进的管理后台且要求密码，用 README 记载的老版本默认密码 `FileCodeBox2023`（登录后立刻改）
2. 后台入口：`https://fcb.sakurain.net/#/admin`
3. **进后台 → 系统设置，三件事**：
   - 修改管理员密码
   - **`uploadSize` （文件大小限制，默认仅 10MB）按需调大**——注意 nginx 层的 `client_max_body_size` 要 ≥ 它，两边匹配才生效
   - 按需收紧：游客上传开关、错误次数限制、默认过期时间
4. 回前台上传一个文件，拿取件码；无痕窗口取回——闭环成立
5. 顺手的妙用：取件链接可以直接 `wget`（终端取件），适合你在服务器之间传文件

## 7 已知坑与对策

|现象|原因与对策|
| ------------------------| ------------------------------------------------------|
|上传报 413|双层限制：nginx `client_max_body_size` 和后台 `uploadSize` 都要调，且 nginx ≥ 应用|
|大文件传输中断|`proxy_read_timeout` 太短，或缺 `proxy_buffering off`|
|反代后 502|`proxy_pass` 的容器名和实际不一致：本文用 `filecodebox`（你的容器名），`docker exec nginx wget -qO- http://filecodebox:12345` 自检|
|容器没起就反代|老规矩：等 `docker compose ps`  healthy/running 再 reload|
|配置改了重启失效|v2.x 配置在数据卷 `.env2`，确认挂的是命名卷 `fcb-data` 而不是临时目录|
|后台密码丢失|数据卷里的 `.env2` 存有配置；实在不行删卷重来（文件会丢，慎）|
|老教程的 `ADMIN_PASSWORD` 环境变量不生效|那是 ≤1.7 的配置方式，v2.x 一律走后台 UI / `.env2`|

## 8 日常维护

|事项|操作|
| --------| ----------------------------------------------------------|
|证书续期|`renew.sh` 自动覆盖|
|备份|数据全在命名卷：`docker run --rm -v filecodebox_fcb-data:/data -v /opt/backup:/backup alpine tar -czf /backup/fcb-$(date +%F).tar.gz -C /data .`|
|升级|GitHub Releases 看新版 → 改 compose tag → `docker compose pull && docker compose up -d`（数据在卷里）|
|磁盘监控|`docker system df -v`；文件分享类应用磁盘增长快，盯紧 `fcb-data`|

## 9 安全清单

- [ ] filecodebox 未映射任何宿主机端口（`docker ps` 确认无 0.0.0.0:12345）
- [ ] 管理员密码已改（不再是 `FileCodeBox2023` 默认值）
- [ ] `uploadSize` 按需调整且与 nginx 层匹配
- [ ] 游客上传按需求收紧（公网服务，默认越紧越好）
- [ ] `fcb-data` 卷不进 Git；备份包异地保存
- [ ] 内地节点域名备案有效

---

## 版本说明

- FileCodeBox：`lanol/filecodebox:2.8.5`（官方 README 建议锁版本，latest 指向最新正式版）
- 配置模型：v2.x 应用配置在管理后台 UI，持久化于数据卷 `.env2`；≤1.7 时代的环境变量配置已废弃（Wiki 老教程注意甄别）
- 认证模型：单管理员密码（首访初始化或默认 `FileCodeBox2023`），无多用户体系——公网部署务必改密
- 彩蛋：官方支持 MCP Streamable HTTP（`/mcp` 端点），可从 AI 客户端直接创建分享
- Compose：V2 语法（无 `version:` 字段）

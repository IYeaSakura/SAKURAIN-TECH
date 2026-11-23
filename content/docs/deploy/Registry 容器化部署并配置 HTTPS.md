# Registry 容器化部署并配置 HTTPS

> 环境：Ubuntu 26.04 LTS ｜ Docker + Compose V2 ｜ Docker Registry v2（官方镜像）
> 域名：registry.sakurain.net ｜ 镜像：registry（Docker Hub 官方，走腾讯云 mirror 拉取）
> 前置：已按[《Nginx 容器化部署和使用》](/docs/deploy/nginx)部署好 nginx-proxy

---

## 1 架构

```
CI Runner / 本机 ──HTTPS──> nginx（80/443，registry.sakurain.net）
                                │ proxy_pass http://registry:5000（proxy 网络）
                                ▼
                        registry 容器（不映射宿主机端口；
                        自带 htpasswd 认证：push/login 需账号，与 nginx 的 Basic Auth 是两套）
```

- Registry 自带应用级 Basic Auth（htpasswd，**bcrypt 格式**），通过 `docker login` 使用
- **不要**把 nginx 的 Basic Auth 叠上去——两层认证会让 `docker login` 和 `docker push` 的凭据传递互相干扰，客户端行为变得诡异
- 镜像数据落在 `./data`，是纯文件目录，备份 = tar 打包
- 定位：**CI/CD 闭环的仓库**——GitLab Runner 构建出的镜像 push 到这里，再从这里 deploy

## 2 前置检查

```bash
# 域名 A 记录：registry → 服务器公网 IP
dig +short registry.sakurain.net

# 磁盘规划（镜像很能吃空间）
df -h /opt
```

## 3 部署 Registry

### 3.1 生成 htpasswd（registry 原生认证，bcrypt 格式是硬性要求）

```bash
mkdir -p /opt/registry/{data,auth} && cd /opt/registry

# ⚠️ 必须加 -B（bcrypt），registry 只认这个格式；不加会 401 或启动报错
htpasswd -Bbn <你的用户名> <强密码> > auth/htpasswd
chmod 644 auth/htpasswd
cat auth/htpasswd        # 每行形如：user:$2y$05$xxxx...（以 $2 开头即 bcrypt）

# 后续加用户（去掉 -c 语义：用 >> 追加，或重新生成整份）
htpasswd -Bb auth/htpasswd <新用户> <密码>
```

### 3.2 compose（/opt/registry/docker-compose.yml）

```yaml
services:
  registry:
    image: registry:2.8.3                # 官方 registry，锁版本
    container_name: registry
    environment:
      REGISTRY_AUTH: htpasswd
      REGISTRY_AUTH_HTPASSWD_REALM: "Registry Realm"
      REGISTRY_AUTH_HTPASSWD_PATH: /auth/htpasswd
      REGISTRY_STORAGE_DELETE_ENABLED: "true"      # 允许删除镜像（回收空间用）
      REGISTRY_STORAGE_FILESYSTEM_ROOTDIRECTORY: /var/lib/registry
      REGISTRY_HTTP_ADDR: 0.0.0.0:5000
    volumes:
      - ./data:/var/lib/registry          # 镜像 blobs，慢慢长大
      - ./auth:/auth:ro                   # htpasswd，只读
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:5000/v2/ 2>&1 | grep -q Unauthorized"]
      interval: 30s
      timeout: 5s
      retries: 3
    logging:
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

### 3.3 启动

```bash
docker compose up -d
docker compose ps          # (healthy) 即就绪；起不来先 docker compose logs registry
```

## 4 申请子域名证书

```bash
cd /opt/nginx-proxy
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d registry.sakurain.net \
  --email wangyuyang2004@foxmail.com --agree-tos --no-eff-email
```

## 5 配置 nginx vhost 并生效

新建 `/opt/nginx-proxy/nginx/conf.d/registry.sakurain.net.conf`：

```nginx
server {
    listen 80;
    server_name registry.sakurain.net;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    http2 on;
    server_name registry.sakurain.net;

    ssl_certificate     /etc/letsencrypt/live/registry.sakurain.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/registry.sakurain.net/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    client_max_body_size 0;              # ← 关键：推镜像的 blob 层可能几 GB，关掉 body 限制
    proxy_read_timeout 3600s;            # 大镜像推送慢，别 60s 掐断
    proxy_send_timeout 3600s;

    location / {
        proxy_pass http://registry:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;                     # registry 从 Host 推断域名
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # docker 客户端走 HTTP/1.1 长连接，大层传输更稳
        proxy_buffering off;
    }
}
```

```bash
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

## 6 登录与推拉验证（部署的验收标准）

```bash
# 1. 登录（输入 3.1 设置的 用户名/密码）
docker login registry.sakurain.net

# 2. 拉一个公共小镜像 → 改 tag → 推上去
docker pull hello-world
docker tag hello-world registry.sakurain.net/test/hello-world:v1
docker push registry.sakurain.net/test/hello-world:v1

# 3. 本机删掉再拉回来，验证闭环
docker rmi registry.sakurain.net/test/hello-world:v1
docker pull registry.sakurain.net/test/hello-world:v1

# 4. 查看仓库里有什么（v2 API）
curl -s -u '<用户名>:<密码>' https://registry.sakurain.net/v2/_catalog
# 预期输出：{"repositories":["test/hello-world"]}
```

四步全绿，CI/CD 闭环的"仓库"这一环就焊死了。以后 GitLab CI 里就是同样的 login → build → push 流程。

## 7 已知坑与对策

|现象|原因与对策|
| ---------------------| ----------------------------------------------------------------------------------------|
|push 到一半 `413 Request Entity Too Large`|`client_max_body_size 0` 没配或没 reload|
|`unauthorized: authentication required`|没 `docker login`；或 htpasswd 不是 bcrypt（重新 `htpasswd -Bb`）；或密码含特殊字符被 shell 吃了，用单引号|
|login 成功但 push 报 `denied: requested access to the resource is denied`|登录的用户不在 htpasswd 里（追加用户格式错）；registry 重启后 realm 变化导致，重新 login|
|registry 容器起不来，`error parsing htpasswd`|htpasswd 文件混入了明文或 md5 格式——必须全部 bcrypt（`$2y$` 开头）|
|镜像删除后磁盘没释放|registry 是内容寻址存储，删 manifest 只是打标记。需要回收：`docker exec registry registry garbage-collect /etc/docker/registry/config.yml`（建议先 stop 再跑）|
|F12 看到 401 一堆|正常——未带凭据访问 API 就是 401，registry 的 realm 提示|
|推超大镜像超时|`proxy_read_timeout`/`proxy_send_timeout` 加大；确认走 HTTPS（HTTP 下 docker 拒绝 push）|

## 8 日常维护

|事项|操作|
| ------------| ---------------------------------------|
|证书续期|无需改动——`renew.sh` 自动覆盖|
|看磁盘占用|`du -sh /opt/registry/data`（镜像 blobs 全在这）|
|删除废弃镜像|API 删 manifest → 停容器 → `garbage-collect` → 起容器|
|备份|`docker compose stop && tar -czf backup-$(date +%F).tar.gz data auth && docker compose start`|
|升级|`docker compose pull && docker compose up -d`（数据卷兼容）|
|CI 对接预告|GitLab CI 里用 `docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD registry.sakurain.net`；下篇 Runner 文档会展开|

---

## 版本说明

- Registry：官方 `registry:2.8.3`（分发仓库事实标准镜像，仅实现 OCI Distribution Spec 的存储与分发，无 Web UI）
- 认证：htpasswd Basic Auth（bcrypt），应用层原生支持，`docker login` 直接使用
- 存储：本地文件系统（内容寻址 blobs）；高阶需求（多副本、S3 后端、扫描签名）请评估 Harbor，但那是另一个量级的部署
- Compose：V2 语法（无 `version:` 字段）

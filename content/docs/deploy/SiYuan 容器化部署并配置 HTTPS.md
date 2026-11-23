# SiYuan 容器化部署并配置 HTTPS

> 环境：Ubuntu 26.04 LTS ｜ Docker + Compose V2 ｜ 思源笔记（SiYuan）官方镜像
> 域名：siyuan.sakurain.net ｜ 镜像：b3log/siyuan:v3.8.1（Docker Hub，走腾讯云 mirror 拉取）
> 前置：已按[《Nginx 容器化部署和使用》](/docs/deploy/nginx)部署好 nginx-proxy

---

## 1 架构

```
浏览器（电脑/手机/平板）──HTTPS──> nginx（80/443，siyuan.sakurain.net）
                                        │ proxy_pass http://siyuan:6806（proxy 网络）
                                        ▼
                                 siyuan 容器（不映射宿主机端口；内核 + 数据全在 ./workspace）
```

- 思源是"本地优先"架构：数据就是你工作区目录里的纯文件（Markdown + 附件），容器只是内核
- 与 DSH/GitLab 同模式：nginx 独占入口、容器不发布端口
- 自带**访问授权码**（锁屏口令）+ 可选的账号体系，不需要再套 Basic Auth

## 2 前置检查与认知

**部署前必须知道的三件事**（Docker 版的官方限制，免得装完失望）：

1. **只有浏览器入口**：桌面客户端和手机 App 不能连这个 Docker 实例。全设备浏览器访问就是它的完整形态
2. **容器内不能"导入 Markdown"功能**（导出 PDF/HTML/Word 也没有）——但工作区是纯文件目录，有替代路子（第 7 节）
3. **访问授权码强制**：Docker 版不设授权码拒绝启动（安全设计），它是"锁屏口令"，不等同账号密码

```bash
dig +short siyuan.sakurain.net        # A 记录指向服务器
free -h                               # 思源很轻（运行内存约 300~500MB），但顺手看一眼
```

## 3 部署思源笔记

### 3.1 compose（/opt/siyuan/docker-compose.yml）

```yaml
services:
  siyuan:
    image: b3log/siyuan:；latest
    container_name: siyuan
    command:                                    # ⚠️ v3.7.0 起必须显式写 serve，缺了容器起不来
      - serve
      - --workspace=/siyuan/workspace/
    environment:
      TZ: Asia/Shanghai
      PUID: "1000"                             # 与宿主机目录属主对齐
      PGID: "1000"
      SIYUAN_LANG: zh-CN
      SIYUAN_ACCESS_AUTH_CODE: <换成你的强口令>   # 锁屏口令，公网必设；上线后可在界面改
      # SIYUAN_ACCESS_AUTH_CODE_BYPASS: "true" # 仅内网调试用，公网严禁开启
    volumes:
      - ./workspace:/siyuan/workspace          # 数据目录，备份=打包它
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:6806/api/version >/dev/null 2>&1 || exit 1"]
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

### 3.2 启动

```bash
mkdir -p /opt/siyuan/workspace && cd /opt/siyuan
chown -R 1000:1000 /opt/siyuan/workspace    # PUID/PGID=1000，漏了这步就是又一次 EACCES（老朋友了）

docker compose up -d
docker compose ps                            # (healthy) 即就绪；启动很快
docker compose logs --tail 20                # 看到 kernel booted / http server is booting 即成功
```

## 4 申请子域名证书

```bash
cd /opt/nginx-proxy
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d siyuan.sakurain.net \
  --email wangyuyang2004@foxmail.com --agree-tos --no-eff-email
```

## 5 配置 nginx vhost 并生效

思源的反代有一个**官方明确要求的特殊点**：内核 WebSocket 走 `/ws` 路径，官方建议单独 location + 长超时（笔记实时协作/推送都靠它）。

新建 `/opt/nginx-proxy/nginx/conf.d/siyuan.sakurain.net.conf`：

```nginx
server {
    listen 80;
    server_name siyuan.sakurain.net;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    http2 on;
    server_name siyuan.sakurain.net;

    ssl_certificate     /etc/letsencrypt/live/siyuan.sakurain.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/siyuan.sakurain.net/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    client_max_body_size 100m;             # 笔记附件/大图片

    location / {
        proxy_pass http://siyuan:6806;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # ── 思源官方要求：/ws 内核 WebSocket 单独块 + 长超时 ──
    location /ws {
        proxy_pass http://siyuan:6806;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

## 6 访问与首次配置

浏览器打开 `https://siyuan.sakurain.net`：

1. 输入**访问授权码**（compose 里设的那个）解锁——这是第一层锁
2. 解锁后可进 **设置 → 账号** 设置账号密码（第二层锁，可选但建议开）
3. 界面已自动中文（`SIYUAN_LANG=zh-CN`）
4. 建议进 设置 → 云端：可配置 S3/WebDAV 同步做异地备份（可用已有的对象存储或另一台机器）

## 7 已知坑与对策

|现象|原因与对策|
| ---------------------------| --------------------------------------------------------------------------------------|
|容器启动即退出|① v3.7.0+ 的 command 缺 `serve`（本文已含）② 没设 `SIYUAN_ACCESS_AUTH_CODE`（强制项）|
|无限重启，日志 `chown: /siyuan/workspace: No such file or directory`|挂载路径写错（必须是 `/siyuan/workspace`，不是 /app/data）或宿主目录不存在|
|进入后一直"连接中"/无法保存|`/ws` 没单独反代或超时太短，见第 5 节|
|附件上传 413|`client_max_body_size` 调大|
|手机浏览器体验差|正常——Docker 版就是桌面浏览器优先；移动端凑合用|
|授权码忘了|改 compose 里的 `SIYUAN_ACCESS_AUTH_CODE` 重建容器（数据不受影响）|
|笔记内容丢失恐慌|先查 `workspace/data/` 文件还在不在——文件在就一切都好；不在就从备份恢复|
|想用桌面 App/手机 App 连|Docker 版不支持，这是官方限制不是配置问题；多端 App 场景需要官方云端或用桌面端自开同步|

## 8 日常维护

|事项|操作|
| -------------| ------------------------------------------------------------------------------------------------------------------|
|证书续期|无需改动——`renew.sh` 自动覆盖|
|备份（每周）|`cd /opt/siyuan && docker compose stop && tar -czf backup-$(date +%F).tar.gz workspace && docker compose start`；备份文件挪到别处|
|⚠️ 千万别做|**不要**用网盘/同步盘直接同步 `workspace` 目录（思源运行中会产生锁文件和临时状态，硬同步会损坏数据库）——要同步就 stop 后备份包|
|升级|查 GitHub Releases 最新版 → 改 compose tag → `docker compose pull && docker compose up -d`（跨版本先看 changelog，v3.7.0 那样的破坏性变更优先看官方升级说明）|
|磁盘监控|`du -sh /opt/siyuan/workspace`——附件是大头|

## 9 安全清单（部署完逐项打勾）

- [ ] siyuan 未映射任何宿主机端口
- [ ] 访问授权码已设置且不是弱口令（它等于公网入口钥匙）
- [ ] 账号密码已设置（第二层锁）
- [ ] `SIYUAN_ACCESS_AUTH_CODE_BYPASS` 未开启
- [ ] `./workspace` 目录不进 Git、不挂网盘同步
- [ ] 每周备份任务已配置
- [ ] 内地节点域名备案有效

---

## 版本说明

- 思源：`b3log/siyuan:v3.8.1`（2026-09 实测稳定版；stable 标签也可用，生产建议锁定版本号）
- 关键变更：v3.7.0（2026-06-30）CLI 重构，命令必须显式 `serve --workspace=...`
- 认证模型：访问授权码（环境变量，强制）+ 应用内账号（可选第二层）；无 Host/Origin 校验，反代无需 trusted-host 类配置
- 数据模型：工作区纯文件（Markdown + 资源），SQLite 索引在 workspace 内；备份=打包 workspace
- Compose：V2 语法（无 `version:` 字段）

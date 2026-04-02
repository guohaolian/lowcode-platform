# 阿里云 Ubuntu + Nginx(8033) 部署说明（Vite 静态站点）

> 目标：把本项目构建产物部署为静态站点，由 Nginx 监听 **8033** 端口，对外提供访问。
>
> 约束：
> - 构建产物目录：`dist/`
> - 服务器部署目录：`/opt/lowcode/www/frontend`
> - Nginx 配置放置目录：`/etc/nginx/sites-available`

---

## 1. 前置准备

### 1.1 服务器与网络

1. 购买/准备阿里云 Ubuntu 服务器（本文以 20.04/22.04/24.04 通用）。
2. 在 **阿里云安全组**放行入方向端口：
   - **8033/TCP**（对外访问必须）
   - **22/TCP**（SSH 登录）
3. 如果服务器启用了 `ufw`，也需要放行：

```bash
sudo ufw allow 8033/tcp
sudo ufw status
```

### 1.2 登录服务器

```bash
ssh root@你的服务器公网IP
# 或者：ssh ubuntu@你的服务器公网IP
```

> 如果使用非 root 用户，下面涉及 `sudo` 的命令照常执行。

---

## 2. 安装 Nginx

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable --now nginx
sudo nginx -v
```

检查 Nginx 服务状态：

```bash
sudo systemctl status nginx --no-pager
```

---

## 3. 准备静态文件目录

按你的要求，静态文件放到：`/opt/lowcode/www/frontend`

```bash
sudo mkdir -p /opt/lowcode/www/frontend
```

建议把目录所有者设为 `www-data`（Nginx 默认运行用户），以便读取文件：

```bash
sudo chown -R www-data:www-data /opt/lowcode
sudo chmod -R 755 /opt/lowcode
```

---

## 4. 构建与上传（两种方式二选一）

该项目脚本在 `package.json` 中定义为：
- 开发：`pnpm dev`
- 构建：`pnpm build`（等价于 `vite build`）

### 方式 A（推荐）：本地构建 → 上传 dist 到服务器

#### 4.1 本地构建

在你本机项目根目录执行：

```bash
pnpm install
pnpm build
```

构建完成后会生成 `dist/`。

#### 4.2 上传到服务器目录

用 `rsync`（推荐）同步 `dist/` 到服务器目录：

```bash
rsync -avz --delete ./dist/ root@你的服务器公网IP:/opt/lowcode/www/frontend/
```

也可以用 `scp`：

```bash
scp -r ./dist/* root@你的服务器公网IP:/opt/lowcode/www/frontend/
```

上传后，在服务器上确认：

```bash
ls -la /opt/lowcode/www/frontend
```

### 方式 B：在服务器上构建（适合 CI/服务器能访问代码仓库）

#### 4.3 安装 Node.js（建议 18+ 或 20+）

你可以用 NodeSource（示例用 20.x）：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

#### 4.4 安装 pnpm

```bash
sudo npm i -g pnpm
pnpm -v
```

#### 4.5 获取代码并构建

以 Git 仓库为例（你也可以用压缩包/上传源码）：

```bash
sudo mkdir -p /opt/lowcode/src
sudo chown -R $USER:$USER /opt/lowcode/src
cd /opt/lowcode/src

# 拉取/更新代码
# git clone <your_repo_url> lowcode-platform
# cd lowcode-platform

pnpm install
pnpm build

sudo rm -rf /opt/lowcode/www/frontend/*
sudo cp -r dist/* /opt/lowcode/www/frontend/

sudo chown -R www-data:www-data /opt/lowcode/www/frontend
sudo chmod -R 755 /opt/lowcode/www/frontend
```

---

## 5. 配置 Nginx（端口 8033，SPA 路由支持）

### 5.1 放置配置文件

把本仓库提供的示例配置拷贝到服务器：

- 示例文件路径：`deploy/nginx/lowcode-frontend-8033.conf`

在服务器上创建站点配置：

```bash
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
sudo nano /etc/nginx/sites-available/lowcode-frontend-8033.conf
```

将示例配置内容粘贴进去（按需改 `server_name`）。

### 5.2 启用站点

```bash
sudo ln -sf /etc/nginx/sites-available/lowcode-frontend-8033.conf /etc/nginx/sites-enabled/lowcode-frontend-8033.conf
```

> 如果你的 Nginx 主配置未包含 `sites-enabled`，需要确认 `/etc/nginx/nginx.conf` 中有：
> `include /etc/nginx/sites-enabled/*;`
>
> Ubuntu 上多数默认已包含。

### 5.3 校验并重载

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. 验证访问

在浏览器访问：

- `http://服务器公网IP:8033/`

在服务器上本地验证：

```bash
curl -I http://127.0.0.1:8033/
```

查看日志排障：

```bash
sudo tail -n 200 /var/log/nginx/lowcode-frontend-8033.access.log
sudo tail -n 200 /var/log/nginx/lowcode-frontend-8033.error.log
```

---

## 7. 常见问题

### 7.1 刷新后 404（Vue Router History 模式）

如果项目使用 history 路由，必须有：

```nginx
try_files $uri $uri/ /index.html;
```

示例配置已包含。

### 7.2 端口能访问但页面空白

- 检查浏览器控制台是否有资源 404。
- 确认 `/opt/lowcode/www/frontend` 下存在 `index.html` 和 `assets/`。
- 确认 Nginx `root` 指向的是**前端产物目录**。

### 7.3 阿里云安全组未放行 8033

如果服务器 `curl 127.0.0.1:8033` 正常，但公网访问不通，通常是安全组或 `ufw` 未放行。

---

## 8. 可选：绑定域名与 HTTPS（不改端口的最简建议）

你目前需求是 8033 端口对外访问；如果后续要走域名 + HTTPS，一般会：
- 外部 80/443 → Nginx（反向代理/转发到 8033 或直接把站点改为 80/443）
- 使用 Let’s Encrypt（certbot）签证书

需要的话我可以按你域名与是否要强制 HTTPS 再给一版配置。
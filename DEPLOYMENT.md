# Video_Cube 项目部署指南 🚀

## 📋 目录
- [项目架构](#项目架构)
- [部署前准备](#部署前准备)
- [本地开发部署](#本地开发部署)
- [生产环境部署](#生产环境部署)
- [Docker 部署](#docker-部署)
- [云平台部署](#云平台部署)
- [常见问题](#常见问题)

---

## 🏗️ 项目架构

```
Video_Cube/
├── Frontend/          # Vue 3 + TypeScript 前端
│   ├── src/
│   ├── public/
│   └── vite.config.ts
├── Backend/           # Node.js + Express 后端
│   ├── routes/       # API 路由
│   ├── models/       # Sequelize 数据模型
│   ├── utils/        # 工具函数
│   ├── public/       # 静态文件
│   └── config/       # 数据库配置
└── models/           # 共享模型
```

**技术栈:**
- 前端: Vue 3, TypeScript, Vite, Vue Router, Pinia
- 后端: Node.js, Express, Sequelize ORM
- 数据库: MySQL
- 文件上传: Multer
- 视频处理: FFmpeg (fluent-ffmpeg)

---

## 🔧 部署前准备

### 1. 系统要求

**软件环境:**
- Node.js: v20.19.0 或 v22.12.0+ (推荐 v22.x LTS)
- MySQL: 5.7+ 或 8.0+
- FFmpeg: 4.0+ (用于视频处理和缩略图生成)
- Git: 用于代码管理
- PM2: (可选) 用于进程管理

**硬件建议:**
- CPU: 2核+
- 内存: 4GB+ (视频处理需要较多内存)
- 磁盘: 20GB+ (视频文件会占用大量空间)
- 带宽: 10Mbps+ (用于视频上传和播放)

### 2. 安装依赖软件

#### 安装 Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

# macOS
brew install node@22

# Windows
# 下载安装包: https://nodejs.org/
```

#### 安装 MySQL
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install mysql-server

# CentOS/RHEL
sudo yum install mysql-server

# macOS
brew install mysql

# Windows
# 下载安装包: https://dev.mysql.com/downloads/mysql/
```

#### 安装 FFmpeg
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install ffmpeg

# CentOS/RHEL
sudo yum install epel-release
sudo yum install ffmpeg

# macOS
brew install ffmpeg

# Windows
# 下载安装包: https://ffmpeg.org/download.html
# 并添加到系统 PATH
```

验证安装:
```bash
node --version    # 应显示 v22.x.x
npm --version     # 应显示 10.x.x
mysql --version   # 应显示 MySQL 版本
ffmpeg -version   # 应显示 FFmpeg 版本
```

---

## 💻 本地开发部署

### 1. 克隆项目
```bash
git clone https://github.com/yourusername/Video_Cube.git
cd Video_Cube
```

### 2. 配置数据库

#### 创建数据库
```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE video_cube CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户并授权 (可选,推荐)
CREATE USER 'video_cube_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON video_cube.* TO 'video_cube_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 配置数据库连接
编辑 `Backend/config/config.json`:
```json
{
  "development": {
    "username": "root",
    "password": "your_password",
    "database": "video_cube",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "timezone": "+08:00"
  }
}
```

### 3. 后端部署

```bash
cd Backend

# 安装依赖
npm install

# 运行数据库迁移 (如果有)
npx sequelize-cli db:migrate

# 启动开发服务器
npm start
```

后端将运行在 `http://localhost:3000`

**验证后端启动:**
```bash
curl http://localhost:3000/api/admin/videos
# 应该返回 JSON 响应
```

### 4. 前端部署

新开一个终端:
```bash
cd Frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将运行在 `http://localhost:5173`

**访问应用:**
打开浏览器访问 `http://localhost:5173`

---

## 🌐 生产环境部署

### 方案一: 传统服务器部署 (推荐)

#### 1. 准备生产服务器
- 一台 Linux 服务器 (Ubuntu 22.04 / CentOS 8 推荐)
- 公网 IP 或域名
- 开放端口: 80 (HTTP), 443 (HTTPS), 3000 (后端 API)

#### 2. 安装 PM2 进程管理器
```bash
npm install -g pm2
```

#### 3. 配置生产数据库
```bash
# 登录 MySQL
mysql -u root -p

# 创建生产数据库
CREATE DATABASE video_cube_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建专用用户
CREATE USER 'video_prod'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON video_cube_production.* TO 'video_prod'@'localhost';
FLUSH PRIVILEGES;
```

编辑 `Backend/config/config.json`:
```json
{
  "production": {
    "username": "video_prod",
    "password": "strong_password_here",
    "database": "video_cube_production",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "timezone": "+08:00",
    "logging": false,
    "pool": {
      "max": 10,
      "min": 0,
      "acquire": 30000,
      "idle": 10000
    }
  }
}
```

#### 4. 部署后端

```bash
cd Backend

# 安装生产依赖
npm install --production

# 创建上传目录
mkdir -p public/uploads/videos
mkdir -p public/uploads/thumbnails

# 设置目录权限
chmod 755 public/uploads
chmod 755 public/uploads/videos
chmod 755 public/uploads/thumbnails

# 运行数据库迁移
NODE_ENV=production npx sequelize-cli db:migrate

# 使用 PM2 启动
NODE_ENV=production pm2 start bin/www --name video-backend

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

#### 5. 构建和部署前端

```bash
cd Frontend

# 安装依赖
npm install

# 修改 API 地址
# 编辑 vite.config.ts 或创建 .env.production
# 将 API 代理地址改为生产环境地址

# 构建生产版本
npm run build

# 构建产物在 dist/ 目录
```

有两种方式部署前端:

**方式 A: 使用 Nginx 托管前端 (推荐)**

安装 Nginx:
```bash
# Ubuntu/Debian
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx
```

配置 Nginx (`/etc/nginx/sites-available/video-cube`):
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 改为你的域名

    # 前端静态文件
    root /var/www/video-cube/frontend;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件访问
    location /uploads/ {
        proxy_pass http://localhost:3000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        
        # 增加超时时间和缓冲区大小 (用于大文件)
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
        
        client_max_body_size 500M;
    }

    # 文件上传大小限制
    client_max_body_size 500M;
    client_body_buffer_size 10M;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
}
```

部署前端文件:
```bash
# 创建目录
sudo mkdir -p /var/www/video-cube/frontend

# 复制构建文件
sudo cp -r Frontend/dist/* /var/www/video-cube/frontend/

# 设置权限
sudo chown -R www-data:www-data /var/www/video-cube
sudo chmod -R 755 /var/www/video-cube

# 启用站点
sudo ln -s /etc/nginx/sites-available/video-cube /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

**方式 B: 使用 Express 托管前端**

```bash
# 将前端构建文件复制到后端
cp -r Frontend/dist/* Backend/public/

# PM2 会自动服务静态文件
```

#### 6. 配置 SSL (HTTPS)

使用 Let's Encrypt 免费证书:
```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 证书会自动更新,测试自动更新
sudo certbot renew --dry-run
```

#### 7. 监控和日志

```bash
# 查看 PM2 进程
pm2 list

# 查看日志
pm2 logs video-backend

# 监控资源使用
pm2 monit

# 重启应用
pm2 restart video-backend

# 停止应用
pm2 stop video-backend

# 删除应用
pm2 delete video-backend
```

Nginx 日志位置:
- 访问日志: `/var/log/nginx/access.log`
- 错误日志: `/var/log/nginx/error.log`

---

## 🐳 Docker 部署

创建 `docker-compose.yml`:
```yaml
version: '3.8'

services:
  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: video_cube_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: video_cube
      MYSQL_USER: video_user
      MYSQL_PASSWORD: video_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - video_network

  # 后端 API
  backend:
    build: ./Backend
    container_name: video_cube_backend
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_USER: video_user
      DB_PASSWORD: video_password
      DB_NAME: video_cube
    depends_on:
      - mysql
    volumes:
      - ./Backend/public/uploads:/app/public/uploads
    networks:
      - video_network

  # 前端
  frontend:
    build: ./Frontend
    container_name: video_cube_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - video_network

volumes:
  mysql_data:

networks:
  video_network:
    driver: bridge
```

创建 `Backend/Dockerfile`:
```dockerfile
FROM node:22-alpine

# 安装 FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 创建上传目录
RUN mkdir -p public/uploads/videos public/uploads/thumbnails

EXPOSE 3000

CMD ["node", "bin/www"]
```

创建 `Frontend/Dockerfile`:
```dockerfile
FROM node:22-alpine as builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 使用 Nginx 托管
FROM nginx:alpine

# 复制构建文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

创建 `Frontend/nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        proxy_pass http://backend:3000/uploads/;
        proxy_http_version 1.1;
        client_max_body_size 500M;
    }

    client_max_body_size 500M;
}
```

**部署命令:**
```bash
# 构建和启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down

# 重新构建
docker-compose up -d --build
```

---

## ☁️ 云平台部署

### 1. Vercel (前端) + Railway (后端)

**前端部署到 Vercel:**
1. 在 Vercel 注册账号
2. 连接 GitHub 仓库
3. 选择 `Frontend` 目录
4. 配置构建命令:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 添加环境变量:
   - `VITE_API_URL`: 后端 API 地址

**后端部署到 Railway:**
1. 在 Railway 注册账号
2. 创建新项目,连接 GitHub
3. 选择 `Backend` 目录
4. 添加 MySQL 数据库服务
5. 配置环境变量:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: 自动提供
6. 部署后会获得公网 URL

### 2. AWS (完整方案)

**架构:**
- EC2: 运行 Node.js 后端
- RDS: MySQL 数据库
- S3: 存储视频和缩略图
- CloudFront: CDN 加速
- Route 53: DNS 管理

**步骤:**
1. 创建 RDS MySQL 实例
2. 创建 EC2 实例,安装 Node.js
3. 创建 S3 存储桶
4. 配置 CloudFront 分发
5. 部署应用代码到 EC2
6. 配置域名和 SSL

### 3. 阿里云 / 腾讯云

**服务选择:**
- ECS 云服务器: 运行应用
- RDS 数据库: MySQL
- OSS 对象存储: 视频文件
- CDN: 加速访问
- SLB 负载均衡: (可选) 高可用

**部署流程:**
1. 购买 ECS 实例 (2核4G起)
2. 购买 RDS MySQL 实例
3. 购买 OSS 存储桶
4. 按照"传统服务器部署"流程操作
5. 配置 OSS 作为视频存储 (需修改代码)

---

## 🔒 安全配置

### 1. 环境变量管理

创建 `.env` 文件 (不要提交到 Git):
```bash
# Backend/.env
NODE_ENV=production
PORT=3000

# 数据库
DB_HOST=localhost
DB_USER=video_prod
DB_PASSWORD=your_secure_password
DB_NAME=video_cube_production

# JWT 密钥 (如果使用身份验证)
JWT_SECRET=your_random_secret_key_here

# 文件上传
MAX_FILE_SIZE=524288000  # 500MB
UPLOAD_DIR=./public/uploads
```

修改 `Backend/config/config.json` 使用环境变量:
```json
{
  "production": {
    "username": "${DB_USER}",
    "password": "${DB_PASSWORD}",
    "database": "${DB_NAME}",
    "host": "${DB_HOST}",
    "dialect": "mysql"
  }
}
```

### 2. 添加到 .gitignore

```bash
# Backend/.gitignore
node_modules/
.env
.env.*
config/config.json
public/uploads/
logs/
*.log

# Frontend/.gitignore
node_modules/
dist/
.env
.env.production
```

### 3. 数据库安全

```bash
# 禁用远程 root 登录
# 删除匿名用户
# 删除测试数据库

mysql_secure_installation
```

### 4. 防火墙配置

```bash
# Ubuntu UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable

# 只允许本地访问 MySQL
sudo ufw deny 3306
```

---

## 📊 性能优化

### 1. 后端优化

**启用 Gzip 压缩:**
```javascript
// Backend/app.js
const compression = require('compression');
app.use(compression());
```

**配置数据库连接池:**
```json
{
  "production": {
    "pool": {
      "max": 10,
      "min": 2,
      "acquire": 30000,
      "idle": 10000
    }
  }
}
```

**添加 Redis 缓存:**
```bash
npm install redis ioredis
```

### 2. 前端优化

**懒加载路由:**
```typescript
// Frontend/src/router/index.ts
const routes = [
  {
    path: '/editor',
    component: () => import('../views/EditorPage.vue')
  }
]
```

**Vite 构建优化:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
})
```

### 3. CDN 加速

将静态资源上传到 CDN:
- 视频文件
- 缩略图
- 前端静态资源

---

## 🔍 监控和维护

### 1. 日志管理

使用 Winston 日志库:
```bash
cd Backend
npm install winston winston-daily-rotate-file
```

### 2. 错误监控

集成 Sentry:
```bash
npm install @sentry/node @sentry/vue
```

### 3. 性能监控

- PM2 Plus: 应用监控
- New Relic: 性能分析
- 阿里云 ARMS: 应用实时监控

### 4. 备份策略

**数据库备份:**
```bash
# 每日备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u video_prod -p video_cube_production > /backup/db_$DATE.sql

# 保留最近7天的备份
find /backup -name "db_*.sql" -mtime +7 -delete
```

**文件备份:**
```bash
# 备份上传文件
rsync -av /path/to/Backend/public/uploads/ /backup/uploads/
```

**添加到 crontab:**
```bash
# 每天凌晨3点备份
0 3 * * * /path/to/backup.sh
```

---

## ❓ 常见问题

### 1. 端口被占用
```bash
# 查看端口占用
lsof -i :3000
# 或
netstat -tuln | grep 3000

# 杀死进程
kill -9 <PID>
```

### 2. FFmpeg 未安装
```bash
# 检查安装
which ffmpeg
ffmpeg -version

# 如果未安装,参考前面的安装步骤
```

### 3. MySQL 连接失败
```bash
# 检查 MySQL 服务
sudo systemctl status mysql

# 启动 MySQL
sudo systemctl start mysql

# 测试连接
mysql -u root -p -h 127.0.0.1
```

### 4. 文件上传失败
```bash
# 检查目录权限
ls -la Backend/public/uploads

# 修改权限
chmod 755 Backend/public/uploads
chown -R $USER:$USER Backend/public/uploads
```

### 5. 前端无法访问后端 API
- 检查后端是否运行: `curl http://localhost:3000`
- 检查防火墙设置
- 检查 Nginx 代理配置
- 检查 CORS 设置

### 6. 视频无法播放
- 检查视频格式是否支持 (MP4, WebM)
- 检查文件路径是否正确
- 检查静态文件服务配置
- 检查浏览器控制台错误

---

## 📝 部署检查清单

部署前:
- [ ] 代码已推送到 GitHub
- [ ] 环境变量已配置
- [ ] 数据库已创建
- [ ] FFmpeg 已安装
- [ ] 端口已开放

部署后:
- [ ] 后端 API 可访问
- [ ] 前端页面可打开
- [ ] 数据库连接正常
- [ ] 文件上传功能正常
- [ ] 视频播放正常
- [ ] 缩略图显示正常
- [ ] SSL 证书已配置
- [ ] 日志记录正常
- [ ] 备份策略已设置

---

## 📞 获取帮助

遇到问题时:
1. 查看日志文件
2. 检查错误信息
3. 搜索 Stack Overflow
4. 查看项目 Issues
5. 提交新的 Issue

**日志位置:**
- PM2: `~/.pm2/logs/`
- Nginx: `/var/log/nginx/`
- MySQL: `/var/log/mysql/`

---

## 🎉 部署成功!

恭喜!你的 Video_Cube 项目已成功部署。

**下一步:**
- 配置域名
- 添加 HTTPS
- 设置监控告警
- 定期备份数据
- 持续优化性能

祝你的项目运行顺利! 🚀

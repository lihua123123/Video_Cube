#!/bin/bash

# Video_Cube 一键部署脚本
# 适用于 Ubuntu/Debian 系统

set -e  # 遇到错误立即退出

echo "======================================"
echo "   Video_Cube 自动部署脚本"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}请使用 sudo 运行此脚本${NC}"
  exit 1
fi

# 1. 更新系统
echo -e "${GREEN}[1/10] 更新系统...${NC}"
apt-get update -y

# 2. 安装 Node.js
echo -e "${GREEN}[2/10] 安装 Node.js 22.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi
echo "Node.js 版本: $(node --version)"
echo "NPM 版本: $(npm --version)"

# 3. 安装 MySQL
echo -e "${GREEN}[3/10] 安装 MySQL...${NC}"
if ! command -v mysql &> /dev/null; then
    apt-get install -y mysql-server
    systemctl start mysql
    systemctl enable mysql
fi

# 4. 安装 FFmpeg
echo -e "${GREEN}[4/10] 安装 FFmpeg...${NC}"
if ! command -v ffmpeg &> /dev/null; then
    apt-get install -y ffmpeg
fi
echo "FFmpeg 版本: $(ffmpeg -version | head -n 1)"

# 5. 安装 PM2
echo -e "${GREEN}[5/10] 安装 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# 6. 安装 Nginx
echo -e "${GREEN}[6/10] 安装 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
fi

# 7. 配置数据库
echo -e "${GREEN}[7/10] 配置数据库...${NC}"
read -p "请输入 MySQL root 密码: " -s MYSQL_ROOT_PASSWORD
echo ""
read -p "请输入要创建的数据库名 (默认: video_cube): " DB_NAME
DB_NAME=${DB_NAME:-video_cube}
read -p "请输入数据库用户名 (默认: video_user): " DB_USER
DB_USER=${DB_USER:-video_user}
read -p "请输入数据库用户密码: " -s DB_PASSWORD
echo ""

mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

echo -e "${GREEN}数据库配置完成!${NC}"

# 8. 配置后端
echo -e "${GREEN}[8/10] 配置后端...${NC}"
cd Backend

# 创建环境变量文件
cat > .env <<EOF
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
EOF

# 更新配置文件
cat > config/config.json <<EOF
{
  "production": {
    "username": "$DB_USER",
    "password": "$DB_PASSWORD",
    "database": "$DB_NAME",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "timezone": "+08:00",
    "logging": false
  }
}
EOF

# 安装依赖
npm install --production

# 创建上传目录
mkdir -p public/uploads/videos
mkdir -p public/uploads/thumbnails
chmod -R 755 public/uploads

# 启动后端
NODE_ENV=production pm2 start bin/www --name video-backend
pm2 save

echo -e "${GREEN}后端配置完成!${NC}"

# 9. 构建前端
echo -e "${GREEN}[9/10] 构建前端...${NC}"
cd ../Frontend
npm install
npm run build

# 部署前端到 Nginx
mkdir -p /var/www/video-cube
cp -r dist/* /var/www/video-cube/
chown -R www-data:www-data /var/www/video-cube

echo -e "${GREEN}前端构建完成!${NC}"

# 10. 配置 Nginx
echo -e "${GREEN}[10/10] 配置 Nginx...${NC}"
read -p "请输入你的域名 (如: example.com, 留空则使用 localhost): " DOMAIN
DOMAIN=${DOMAIN:-localhost}

cat > /etc/nginx/sites-available/video-cube <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    root /var/www/video-cube;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads/ {
        proxy_pass http://localhost:3000/uploads/;
        proxy_http_version 1.1;
        client_max_body_size 500M;
    }

    client_max_body_size 500M;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/video-cube /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试并重启 Nginx
nginx -t
systemctl restart nginx

echo ""
echo -e "${GREEN}======================================"
echo "   部署完成! 🎉"
echo "======================================${NC}"
echo ""
echo "服务状态:"
echo "  - 后端: http://localhost:3000"
echo "  - 前端: http://$DOMAIN"
echo ""
echo "管理命令:"
echo "  - 查看后端日志: pm2 logs video-backend"
echo "  - 重启后端: pm2 restart video-backend"
echo "  - 查看 PM2 状态: pm2 list"
echo "  - 查看 Nginx 日志: tail -f /var/log/nginx/error.log"
echo ""
echo "数据库信息:"
echo "  - 数据库名: $DB_NAME"
echo "  - 用户名: $DB_USER"
echo ""
echo -e "${YELLOW}提示: 如果使用域名,请配置 DNS 解析并考虑安装 SSL 证书${NC}"
echo -e "${YELLOW}SSL 证书安装: sudo certbot --nginx -d $DOMAIN${NC}"
echo ""

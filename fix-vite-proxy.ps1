# 图片代理问题终极修复脚本
# 使用方法: .\fix-vite-proxy.ps1

Write-Host "=== 修复 Vite 图片代理问题 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 停止所有服务
Write-Host "[1/6] 停止所有 Node 进程..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null | Out-Null
taskkill /F /IM nodemon.exe 2>$null | Out-Null
Start-Sleep -Seconds 3
Write-Host "      ✓ 已停止" -ForegroundColor Green

# 2. 验证端口
Write-Host "`n[2/6] 检查端口..." -ForegroundColor Yellow
$port3000 = netstat -ano | Select-String ":3000.*LISTENING"
$port5173 = netstat -ano | Select-String ":5173.*LISTENING"

if ($port3000) {
    Write-Host "      ✗ 端口 3000 仍被占用" -ForegroundColor Red
    exit 1
} else {
    Write-Host "      ✓ 端口 3000 已释放" -ForegroundColor Green
}

if ($port5173) {
    Write-Host "      ✗ 端口 5173 仍被占用" -ForegroundColor Red
    exit 1
} else {
    Write-Host "      ✓ 端口 5173 已释放" -ForegroundColor Green
}

# 3. 检查文件
Write-Host "`n[3/6] 检查图片文件..." -ForegroundColor Yellow
$imageDir = "d:\Code\nodejs\Video_Cube\Backend\public\uploads\images"
if (Test-Path $imageDir) {
    $imageCount = (Get-ChildItem $imageDir -ErrorAction SilentlyContinue).Count
    Write-Host "      ✓ 找到 $imageCount 个图片文件" -ForegroundColor Green
} else {
    Write-Host "      ✗ 图片目录不存在" -ForegroundColor Red
    exit 1
}

# 4. 启动后端
Write-Host "`n[4/6] 启动后端服务 (3000)..." -ForegroundColor Yellow
$backendPath = "d:\Code\nodejs\Video_Cube\Backend"
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '启动后端...' -ForegroundColor Cyan; node bin/www" -PassThru
Start-Sleep -Seconds 5

# 验证后端
try {
    $test = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 3 -ErrorAction Stop
    Write-Host "      ✓ 后端启动成功" -ForegroundColor Green
} catch {
    Write-Host "      ✗ 后端启动失败" -ForegroundColor Red
    Write-Host "      错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. 启动前端
Write-Host "`n[5/6] 启动前端服务 (5173)..." -ForegroundColor Yellow
$frontendPath = "d:\Code\nodejs\Video_Cube\Frontend"
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '启动前端...' -ForegroundColor Cyan; npm exec vite" -PassThru
Start-Sleep -Seconds 8

# 验证前端
try {
    $test = Invoke-WebRequest -Uri "http://localhost:5173" -Method Head -TimeoutSec 3 -ErrorAction Stop
    Write-Host "      ✓ 前端启动成功" -ForegroundColor Green
} catch {
    Write-Host "      ✗ 前端启动失败" -ForegroundColor Red
    Write-Host "      错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 6. 测试图片代理
Write-Host "`n[6/6] 测试图片代理..." -ForegroundColor Yellow

# 测试后端
Write-Host "      测试后端图片访问..." -ForegroundColor Gray
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:3000/uploads/images/950e79b5-f089-4789-828a-fcae9956ef89.png" -Method Head -TimeoutSec 5 -ErrorAction Stop
    $backendType = $backend.Headers.'Content-Type'
    $backendSize = $backend.Headers.'Content-Length'
    
    if ($backendType -like "*image*") {
        Write-Host "      ✓ 后端图片访问正常 ($backendType, $backendSize bytes)" -ForegroundColor Green
    } else {
        Write-Host "      ✗ 后端返回错误类型: $backendType" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "      ✗ 后端图片访问失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 测试前端代理
Write-Host "      测试前端代理..." -ForegroundColor Gray
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173/uploads/images/950e79b5-f089-4789-828a-fcae9956ef89.png" -Method Head -TimeoutSec 5 -ErrorAction Stop
    $frontendType = $frontend.Headers.'Content-Type'
    $frontendSize = $frontend.Headers.'Content-Length'
    
    if ($frontendType -like "*image*") {
        Write-Host "      ✓ 前端代理正常 ($frontendType, $frontendSize bytes)" -ForegroundColor Green
    } else {
        Write-Host "      ✗ 前端代理返回错误类型: $frontendType" -ForegroundColor Red
        Write-Host "      这说明 Vite 的 HTML fallback 拦截了图片请求" -ForegroundColor Yellow
        Write-Host "      需要修复 vite.config.ts 的 proxy 配置" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "      ✗ 前端代理失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== 修复完成 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ 后端运行在: http://localhost:3000" -ForegroundColor Green
Write-Host "✓ 前端运行在: http://localhost:5173" -ForegroundColor Green
Write-Host "✓ 图片代理正常工作" -ForegroundColor Green
Write-Host ""
Write-Host "接下来的步骤:" -ForegroundColor White
Write-Host "1. 在浏览器中打开: http://localhost:5173" -ForegroundColor Yellow
Write-Host "2. 按 F12 打开开发者工具" -ForegroundColor Yellow
Write-Host "3. 切换到 Network 标签" -ForegroundColor Yellow
Write-Host "4. 勾选 'Disable cache'" -ForegroundColor Yellow
Write-Host "5. 刷新页面 (Ctrl+Shift+R)" -ForegroundColor Yellow
Write-Host "6. 测试上传新图片" -ForegroundColor Yellow
Write-Host ""

# 快速修复图片加载问题
# 使用方法: 在 PowerShell 中运行 .\fix-image-loading.ps1

Write-Host "=== 修复图片加载问题 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 停止所有 Node 进程
Write-Host "[1/6] 停止所有 Node 进程..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "      已停止所有 Node 进程 ✓" -ForegroundColor Green
} else {
    Write-Host "      没有运行的 Node 进程" -ForegroundColor Gray
}
Start-Sleep -Seconds 2

# 2. 验证端口已释放
Write-Host "`n[2/6] 验证端口状态..." -ForegroundColor Yellow
$port5173 = netstat -ano | Select-String "5173"
$port3000 = netstat -ano | Select-String "3000"

if ($port5173) {
    Write-Host "      警告: 端口 5173 仍被占用 ✗" -ForegroundColor Red
    $port5173 | ForEach-Object {
        $parts = $_ -split '\s+'
        $pid = $parts[-1]
        Write-Host "      尝试终止进程 PID: $pid" -ForegroundColor Yellow
        taskkill /F /PID $pid 2>$null
    }
} else {
    Write-Host "      端口 5173 已释放 ✓" -ForegroundColor Green
}

if ($port3000) {
    Write-Host "      警告: 端口 3000 仍被占用 ✗" -ForegroundColor Red
} else {
    Write-Host "      端口 3000 已释放 ✓" -ForegroundColor Green
}

# 3. 验证图片文件
Write-Host "`n[3/6] 验证图片文件..." -ForegroundColor Yellow
$imagePath = "d:\Code\nodejs\Video_Cube\Backend\public\uploads\images"
if (Test-Path $imagePath) {
    $imageCount = (Get-ChildItem $imagePath -ErrorAction SilentlyContinue).Count
    Write-Host "      找到 $imageCount 个图片文件 ✓" -ForegroundColor Green
} else {
    Write-Host "      警告: 图片目录不存在 ✗" -ForegroundColor Red
}

# 4. 启动后端
Write-Host "`n[4/6] 启动后端服务..." -ForegroundColor Yellow
$backendPath = "d:\Code\nodejs\Video_Cube\Backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '启动后端服务...' -ForegroundColor Cyan; node bin/www"
Write-Host "      后端服务正在启动... (端口 3000)" -ForegroundColor Gray
Start-Sleep -Seconds 5

# 5. 启动前端
Write-Host "`n[5/6] 启动前端服务..." -ForegroundColor Yellow
$frontendPath = "d:\Code\nodejs\Video_Cube\Frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '启动前端服务...' -ForegroundColor Cyan; npm exec vite"
Write-Host "      前端服务正在启动... (端口 5173)" -ForegroundColor Gray
Start-Sleep -Seconds 5

# 6. 测试连接
Write-Host "`n[6/6] 检查服务状态..." -ForegroundColor Yellow
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 3 -ErrorAction Stop
    Write-Host "      后端服务 (3000): OK ✓" -ForegroundColor Green
} catch {
    Write-Host "      后端服务 (3000): 启动中或失败 ⚠" -ForegroundColor Yellow
}

try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -Method Head -TimeoutSec 3 -ErrorAction Stop
    Write-Host "      前端服务 (5173): OK ✓" -ForegroundColor Green
} catch {
    Write-Host "      前端服务 (5173): 启动中或失败 ⚠" -ForegroundColor Yellow
}

# 7. 测试图片访问
Write-Host "`n[测试] 检查图片代理..." -ForegroundColor Yellow
$testImage = "01466abb-935a-470d-b3fd-1ccfb87ef2ff.png"
try {
    $imageTest = Invoke-WebRequest -Uri "http://localhost:3000/uploads/images/$testImage" -Method Head -TimeoutSec 3 -ErrorAction Stop
    Write-Host "      后端图片访问: OK ✓" -ForegroundColor Green
    Write-Host "      图片大小: $($imageTest.Headers.'Content-Length') bytes" -ForegroundColor Gray
} catch {
    Write-Host "      后端图片访问: 失败 ✗" -ForegroundColor Red
}

Write-Host "`n=== 修复完成 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "接下来的步骤:" -ForegroundColor White
Write-Host "1. 在浏览器中打开: http://localhost:5173" -ForegroundColor Green
Write-Host "2. 按 Ctrl+Shift+Delete 清除浏览器缓存" -ForegroundColor Yellow
Write-Host "3. 刷新页面 (F5)" -ForegroundColor Yellow
Write-Host "4. 测试上传新图片" -ForegroundColor Yellow
Write-Host ""
Write-Host "如果图片仍无法显示，请:" -ForegroundColor White
Write-Host "- 打开浏览器开发者工具 (F12)" -ForegroundColor Gray
Write-Host "- 切换到 Network 标签" -ForegroundColor Gray
Write-Host "- 上传图片并观察请求状态" -ForegroundColor Gray
Write-Host "- 检查 Console 是否有错误信息" -ForegroundColor Gray
Write-Host ""

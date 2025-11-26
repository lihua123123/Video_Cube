# 快速修复脚本 - 重建仓库
# 这会创建一个全新的 Git 历史,不包含大文件

Write-Host "======================================"
Write-Host "  Git 大文件问题 - 快速修复"
Write-Host "======================================"
Write-Host ""

# 1. 备份当前 .git 目录
Write-Host "[1/6] 备份当前 .git 目录..." -ForegroundColor Cyan
if (Test-Path ".git.backup") {
    Remove-Item -Recurse -Force ".git.backup"
}
Copy-Item -Recurse ".git" ".git.backup"
Write-Host "✓ 已备份到 .git.backup" -ForegroundColor Green

# 2. 删除 .git 目录
Write-Host "[2/6] 删除当前 Git 历史..." -ForegroundColor Cyan
Remove-Item -Recurse -Force ".git"
Write-Host "✓ 已删除" -ForegroundColor Green

# 3. 重新初始化仓库
Write-Host "[3/6] 重新初始化 Git 仓库..." -ForegroundColor Cyan
git init
Write-Host "✓ 已初始化" -ForegroundColor Green

# 4. 添加所有文件
Write-Host "[4/6] 添加所有文件..." -ForegroundColor Cyan
git add .
Write-Host "✓ 已添加文件" -ForegroundColor Green

# 5. 创建初始提交
Write-Host "[5/6] 创建初始提交..." -ForegroundColor Cyan
git commit -m "Initial commit - Clean repository without large files"
Write-Host "✓ 已提交" -ForegroundColor Green

# 6. 连接到远程仓库
Write-Host "[6/6] 连接到 GitHub..." -ForegroundColor Cyan
git remote add origin https://github.com/lihua123123/Video_Cube.git
git branch -M main
Write-Host "✓ 已连接" -ForegroundColor Green

Write-Host ""
Write-Host "======================================"
Write-Host "  准备就绪!"
Write-Host "======================================"
Write-Host ""
Write-Host "现在执行以下命令完成推送:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  git push -u origin main --force" -ForegroundColor Cyan
Write-Host ""
Write-Host "注意: 这会覆盖远程仓库的历史" -ForegroundColor Red
Write-Host ""

$push = Read-Host "是否立即推送? (y/N)"
if ($push -eq 'y' -or $push -eq 'Y') {
    Write-Host ""
    Write-Host "正在推送到 GitHub..." -ForegroundColor Cyan
    git push -u origin main --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 成功推送到 GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "现在可以安全删除备份:" -ForegroundColor Yellow
        Write-Host "  Remove-Item -Recurse -Force .git.backup" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ 推送失败,请检查网络或权限" -ForegroundColor Red
        Write-Host ""
        Write-Host "如需恢复,运行:" -ForegroundColor Yellow
        Write-Host "  Remove-Item -Recurse -Force .git" -ForegroundColor Cyan
        Write-Host "  Move-Item .git.backup .git" -ForegroundColor Cyan
    }
} else {
    Write-Host "已取消自动推送" -ForegroundColor Yellow
    Write-Host "准备好后手动执行: git push -u origin main --force" -ForegroundColor Cyan
}

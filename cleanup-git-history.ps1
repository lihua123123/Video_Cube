# 清理 Git 历史中的大文件 (Windows PowerShell 版本)
# 警告: 这会重写 Git 历史!

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  清理 Git 历史中的大文件" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  警告: 此操作会重写 Git 历史!" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "确定要继续吗? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "已取消" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "正在清理以下类型的文件:" -ForegroundColor Green
Write-Host "  - 视频文件 (*.mp4, *.avi, etc.)"
Write-Host "  - FFmpeg 二进制文件"
Write-Host "  - uploads 目录"
Write-Host ""

# 方法 1: 使用 git filter-repo (推荐,更快更安全)
Write-Host "检查是否安装了 git-filter-repo..." -ForegroundColor Yellow

if (Get-Command git-filter-repo -ErrorAction SilentlyContinue) {
    Write-Host "✓ 已安装 git-filter-repo,使用快速清理方法" -ForegroundColor Green
    
    # 创建路径过滤文件
    @"
# 要移除的路径
ffmpeg/
**/ffmpeg*/
Backend/public/uploads/
**/uploads/
"@ | Out-File -FilePath "paths-to-remove.txt" -Encoding UTF8
    
    # 创建文件名过滤规则
    @"
*.mp4
*.avi
*.mov
*.wmv
*.flv
*.webm
*.mkv
*.exe
"@ | Out-File -FilePath "files-to-remove.txt" -Encoding UTF8
    
    Write-Host "[1/3] 移除指定目录..." -ForegroundColor Cyan
    git filter-repo --invert-paths --paths-from-file paths-to-remove.txt --force
    
    Write-Host "[2/3] 移除大文件..." -ForegroundColor Cyan
    git filter-repo --strip-blobs-bigger-than 100M --force
    
    Write-Host "[3/3] 清理完成!" -ForegroundColor Green
    
    # 清理临时文件
    Remove-Item "paths-to-remove.txt" -ErrorAction SilentlyContinue
    Remove-Item "files-to-remove.txt" -ErrorAction SilentlyContinue
    
} else {
    Write-Host "✗ 未安装 git-filter-repo" -ForegroundColor Red
    Write-Host ""
    Write-Host "请选择以下方法之一:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "方法 A: 安装 git-filter-repo (推荐)" -ForegroundColor Cyan
    Write-Host "  pip install git-filter-repo"
    Write-Host "  然后重新运行此脚本"
    Write-Host ""
    Write-Host "方法 B: 使用 BFG Repo-Cleaner" -ForegroundColor Cyan
    Write-Host "  1. 下载 BFG: https://rtyley.github.io/bfg-repo-cleaner/"
    Write-Host "  2. 运行以下命令:"
    Write-Host "     java -jar bfg.jar --strip-blobs-bigger-than 100M"
    Write-Host "     java -jar bfg.jar --delete-folders uploads"
    Write-Host "     java -jar bfg.jar --delete-folders ffmpeg"
    Write-Host "     git reflog expire --expire=now --all"
    Write-Host "     git gc --prune=now --aggressive"
    Write-Host ""
    Write-Host "方法 C: 手动移除文件并重置历史 (最简单)" -ForegroundColor Cyan
    Write-Host "  见下方说明"
    Write-Host ""
    
    $method = Read-Host "选择继续的方法 (输入 manual 使用手动方法,否则退出)"
    
    if ($method -eq 'manual') {
        Write-Host ""
        Write-Host "=== 手动方法 ===" -ForegroundColor Green
        Write-Host ""
        Write-Host "1. 从当前提交中移除大文件:"
        Write-Host "   git rm -r --cached Backend/public/uploads/ 2>$null"
        Write-Host "   git rm -r --cached ffmpeg/ 2>$null"
        Write-Host "   git rm --cached *.mp4 *.avi *.exe 2>$null"
        Write-Host ""
        Write-Host "2. 提交更改:"
        Write-Host "   git add .gitignore"
        Write-Host "   git commit -m 'Remove large files and update .gitignore'"
        Write-Host ""
        Write-Host "3. 如果还是推不上去,考虑:"
        Write-Host "   - 创建新的空仓库,复制代码 (但不包括 .git 目录)"
        Write-Host "   - 使用 Git LFS 存储大文件"
        Write-Host ""
        
        $execute = Read-Host "是否立即执行步骤1? (y/N)"
        if ($execute -eq 'y' -or $execute -eq 'Y') {
            Write-Host "正在移除大文件..." -ForegroundColor Cyan
            git rm -r --cached Backend/public/uploads/ 2>$null
            git rm -r --cached ffmpeg/ 2>$null
            git rm --cached *.mp4 2>$null
            git rm --cached *.avi 2>$null
            git rm --cached *.exe 2>$null
            Write-Host "✓ 完成!现在请运行:" -ForegroundColor Green
            Write-Host "  git add .gitignore" -ForegroundColor Yellow
            Write-Host "  git commit -m 'Remove large files'" -ForegroundColor Yellow
        }
    } else {
        Write-Host "已退出。请先安装 git-filter-repo" -ForegroundColor Red
    }
    exit
}

Write-Host ""
Write-Host "✅ 清理完成!" -ForegroundColor Green
Write-Host ""
Write-Host "下一步:" -ForegroundColor Cyan
Write-Host "  1. 查看清理结果:"
Write-Host "     git log --oneline"
Write-Host ""
Write-Host "  2. 强制推送到远程仓库:"
Write-Host "     git push origin main --force" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. 如果有团队成员,通知他们重新克隆仓库" -ForegroundColor Yellow
Write-Host ""

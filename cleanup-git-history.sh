#!/bin/bash

# 清理 Git 历史中的大文件
# 警告: 这会重写 Git 历史!请确保团队成员知晓

echo "======================================"
echo "  清理 Git 历史中的大文件"
echo "======================================"
echo ""
echo "⚠️  警告: 此操作会重写 Git 历史!"
echo ""
read -p "确定要继续吗? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "已取消"
    exit 1
fi

echo ""
echo "正在清理以下类型的文件:"
echo "  - 视频文件 (*.mp4, *.avi, etc.)"
echo "  - FFmpeg 二进制文件"
echo "  - uploads 目录"
echo ""

# 移除 FFmpeg 相关文件
echo "[1/5] 移除 FFmpeg 二进制文件..."
git filter-branch --force --index-filter \
  'git rm -r --cached --ignore-unmatch ffmpeg/' \
  --prune-empty --tag-name-filter cat -- --all

git filter-branch --force --index-filter \
  'git rm -r --cached --ignore-unmatch **/ffmpeg*/' \
  --prune-empty --tag-name-filter cat -- --all

git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch *.exe' \
  --prune-empty --tag-name-filter cat -- --all

# 移除视频文件
echo "[2/5] 移除视频文件..."
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch "*.mp4" "*.avi" "*.mov" "*.wmv" "*.flv" "*.webm" "*.mkv"' \
  --prune-empty --tag-name-filter cat -- --all

# 移除 uploads 目录
echo "[3/5] 移除 uploads 目录..."
git filter-branch --force --index-filter \
  'git rm -r --cached --ignore-unmatch Backend/public/uploads/' \
  --prune-empty --tag-name-filter cat -- --all

git filter-branch --force --index-filter \
  'git rm -r --cached --ignore-unmatch **/uploads/' \
  --prune-empty --tag-name-filter cat -- --all

# 清理引用
echo "[4/5] 清理引用..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now
git gc --aggressive --prune=now

echo "[5/5] 完成!"
echo ""
echo "✅ 大文件已从 Git 历史中移除"
echo ""
echo "下一步:"
echo "  1. 强制推送到远程仓库:"
echo "     git push origin main --force"
echo ""
echo "  2. 通知团队成员重新克隆仓库"
echo ""

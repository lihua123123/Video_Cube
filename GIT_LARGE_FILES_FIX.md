# Git 大文件问题解决方案 🔧

## 问题描述
推送代码到 GitHub 时出现错误:文件超过 100MB 限制
- FFmpeg 二进制文件 (~183MB)
- 上传的视频文件 (~184MB)

## 🚀 快速解决方案 (推荐)

### 方法 1: 移除当前提交中的大文件 (最简单)

```powershell
# 1. 确保在项目根目录
cd d:\Code\nodejs\Video_Cube

# 2. 从 Git 缓存中移除大文件 (但保留本地文件)
git rm -r --cached Backend/public/uploads/ 2>$null
git rm -r --cached ffmpeg/ 2>$null
git rm --cached *.mp4 2>$null
git rm --cached *.avi 2>$null
git rm --cached *.exe 2>$null

# 3. 提交更改
git add .gitignore
git commit -m "Remove large files from Git tracking"

# 4. 推送到 GitHub
git push origin main
```

**优点**: 
- ✅ 简单快速
- ✅ 不重写历史
- ✅ 安全

**缺点**:
- ❌ 大文件仍在 Git 历史中
- ❌ 如果之前已经推送过,仍然会失败

---

### 方法 2: 使用 Git Filter-Repo 清理历史 (推荐)

#### 安装 git-filter-repo
```powershell
# 使用 pip 安装
pip install git-filter-repo
```

#### 运行清理脚本
```powershell
# 运行 PowerShell 脚本
.\cleanup-git-history.ps1
```

或手动执行:
```powershell
# 移除所有大于 100MB 的文件
git filter-repo --strip-blobs-bigger-than 100M --force

# 移除特定目录
git filter-repo --path Backend/public/uploads/ --invert-paths --force
git filter-repo --path ffmpeg/ --invert-paths --force

# 强制推送
git push origin main --force
```

**优点**:
- ✅ 彻底清理历史
- ✅ 减小仓库大小
- ✅ 快速安全

**缺点**:
- ❌ 需要安装工具
- ❌ 重写历史 (需要 force push)

---

### 方法 3: 使用 BFG Repo-Cleaner

#### 下载 BFG
下载地址: https://rtyley.github.io/bfg-repo-cleaner/

#### 运行清理
```powershell
# 移除大文件
java -jar bfg.jar --strip-blobs-bigger-than 100M

# 移除特定目录
java -jar bfg.jar --delete-folders uploads
java -jar bfg.jar --delete-folders ffmpeg

# 清理和压缩
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 强制推送
git push origin main --force
```

**优点**:
- ✅ 功能强大
- ✅ 速度快
- ✅ 简单易用

**缺点**:
- ❌ 需要 Java 环境
- ❌ 需要下载额外工具

---

### 方法 4: 创建新仓库 (最彻底)

如果以上方法都不行,最简单的办法是创建新仓库:

```powershell
# 1. 备份当前代码
cd ..
Copy-Item -Recurse Video_Cube Video_Cube_backup

# 2. 删除 .git 目录 (移除所有历史)
cd Video_Cube
Remove-Item -Recurse -Force .git

# 3. 删除大文件
Remove-Item -Recurse -Force Backend/public/uploads/
Remove-Item -Recurse -Force ffmpeg/

# 4. 重新初始化 Git
git init
git add .
git commit -m "Initial commit"

# 5. 连接到 GitHub (新建或清空现有仓库)
git remote add origin https://github.com/lihua123123/Video_Cube.git
git branch -M main
git push -u origin main --force
```

**优点**:
- ✅ 最简单
- ✅ 100% 有效
- ✅ 干净的历史

**缺点**:
- ❌ 丢失所有提交历史
- ❌ 需要通知团队成员

---

## 📋 预防措施

### 1. 更新 .gitignore
确保 `.gitignore` 包含:
```gitignore
# 大文件
*.mp4
*.avi
*.mov
*.exe
**/uploads/
**/ffmpeg/
```

### 2. 使用 Git LFS (大文件存储)
如果项目确实需要追踪大文件:
```powershell
# 安装 Git LFS
git lfs install

# 追踪大文件类型
git lfs track "*.mp4"
git lfs track "*.exe"

# 提交 .gitattributes
git add .gitattributes
git commit -m "Add Git LFS"
```

### 3. 使用外部存储
- **视频文件**: 使用云存储 (AWS S3, 阿里云 OSS)
- **FFmpeg**: 在服务器上安装,不放入代码库

### 4. 添加预提交钩子
创建 `.git/hooks/pre-commit`:
```bash
#!/bin/sh
# 检查大文件
max_size=100000000  # 100MB
large_files=$(git diff --cached --name-only | xargs ls -l 2>/dev/null | awk -v max=$max_size '$5 > max {print $9 " (" $5 " bytes)"}')

if [ -n "$large_files" ]; then
    echo "错误: 检测到大文件!"
    echo "$large_files"
    exit 1
fi
```

---

## 🎯 推荐方案

根据你的情况,我建议:

### 立即执行 (方法 1):
```powershell
# 1. 移除大文件
git rm -r --cached Backend/public/uploads/
git rm -r --cached ffmpeg/
git rm --cached *.mp4 *.avi *.exe

# 2. 提交
git add .gitignore
git commit -m "Remove large files and update .gitignore"

# 3. 推送
git push origin main
```

### 如果还失败 (方法 2):
```powershell
# 安装并使用 git-filter-repo
pip install git-filter-repo
git filter-repo --strip-blobs-bigger-than 100M --force
git push origin main --force
```

### 最后手段 (方法 4):
重新创建仓库

---

## ✅ 检查清单

部署前确保:
- [ ] `.gitignore` 已更新
- [ ] 大文件已从 Git 追踪中移除
- [ ] 本地仍保留必要的大文件 (如 FFmpeg)
- [ ] 在 `DEPLOYMENT.md` 中说明如何获取这些文件

部署文档中应包含:
```markdown
## 安装 FFmpeg
不要从仓库获取,请在服务器上安装:
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
# 下载: https://ffmpeg.org/download.html
```

---

## 💡 建议的项目结构

```
Video_Cube/
├── .gitignore           # 忽略大文件
├── README.md            # 说明 FFmpeg 需要单独安装
├── DEPLOYMENT.md        # 部署文档,说明依赖安装
├── Frontend/
│   └── (代码)
└── Backend/
    ├── (代码)
    ├── public/
    │   └── uploads/     # .gitignore (不提交)
    └── config/
        └── config.json  # .gitignore (不提交,使用 .example)
```

---

## 📞 需要帮助?

如果遇到问题:
1. 查看错误信息
2. 检查 `.gitignore` 是否生效: `git check-ignore -v <file>`
3. 查看待提交文件大小: `git ls-files | xargs ls -lh`
4. 提交 Issue 到项目仓库

---

**最后提醒**: 
- ⚠️ `--force` 推送会重写远程历史
- ⚠️ 使用前确保团队成员知晓
- ⚠️ 建议先在测试分支尝试

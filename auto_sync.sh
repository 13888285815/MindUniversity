#!/bin/bash
# 自动同步项目文件到 GitHub
# 每次运行：检查变更，有变化则自动提交并推送

cd "$(dirname "$0")"

# 配置
BRANCH="main"
COMMIT_MSG="Auto-sync: $(date '+%Y-%m-%d %H:%M')"

# 检查是否有变更
if [ -z "$(git status --porcelain)" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 没有文件变更，跳过"
    exit 0
fi

# 显示变更文件
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检测到文件变更:"
git status --short

# 添加所有变更
git add -A

# 提交
git commit -m "$COMMIT_MSG"

# 推送到 GitHub
git push origin $BRANCH

if [ $? -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 同步成功!"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 同步失败!"
    exit 1
fi

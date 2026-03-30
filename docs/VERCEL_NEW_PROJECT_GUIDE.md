# 创建新的 Vercel 项目指南

## 问题诊断
- 原始 Vercel 域名 `client-tau-lime-93.vercel.app` 无法访问（连接超时）
- 可能原因：项目配置错误或已删除

## 解决方案：创建新的 Vercel 项目

### 方案一：通过 Vercel Dashboard（推荐）

#### 步骤 1: 登录
访问 https://vercel.com/new

#### 步骤 2: 导入项目
1. 点击 **Import Project**
2. 连接 GitHub 账号
3. 选择仓库：`13888285815/MindUniversity`
4. 点击 **Import**

#### 步骤 3: 配置项目
**Framework Preset**: 选择 **Other** 或 **Static**

**Build and Output Settings**:
- Build Command: `npm run build`
- Output Directory: `./`（重要！）
- Install Command: `npm ci`

**Environment Variables**:
- `NODE_ENV=production`

#### 步骤 4: 部署
点击 **Deploy** 按钮，等待部署完成

#### 步骤 5: 添加自定义域名
1. 部署完成后，点击 **Settings** → **Domains**
2. 点击 **Add**
3. 输入：`minduniversity.yndxw.com`
4. 点击 **Add**

### 方案二：通过 GitHub 自动部署（最简单）

如果之前项目已连接 GitHub：

1. 推送代码到 GitHub
   ```bash
   git push origin main
   ```

2. 访问 https://vercel.com/new

3. 点击 **Import Project**

4. 选择 GitHub 仓库

5. 配置后点击 **Deploy**

### 方案三：修复现有项目

如果想修复现有项目：

1. 访问 https://vercel.com/dashboard

2. 找到项目（可能需要搜索）

3. 删除旧部署

4. 触发新的部署：
   - Settings → Git → 选择分支
   - 或者点击 Redeploy

## 快速验证步骤

### 1. 检查本地文件
```bash
ls -la index.html
ls -la vercel.json
```

### 2. 验证 JSON 配置
```bash
python3 -m json.tool vercel.json
```

### 3. 测试本地 HTML
```bash
# 在浏览器打开
open index.html
```

## 部署成功后的验证

### DNS 验证
```bash
dig minduniversity.yndxw.com
```
应该看到：
```
minduniversity.yndxw.com.  IN  CNAME  cname.vercel-dns.com.
```

### HTTP 验证
```bash
curl -I https://minduniversity.yndxw.com
```
应该看到：
```
HTTP/2 200
server: Vercel
```

### 浏览器验证
访问 https://minduniversity.yndxw.com
应该显示意念大学主页

## 常见问题

### Q: 无法访问 Vercel Dashboard
A: 检查网络连接，尝试：
- 访问 https://vercel.com
- 清除浏览器缓存
- 使用无痕模式

### Q: 找不到项目
A: 可能的项目位置：
- 个人账户
- Team: chinas-projects-bdf7c525
- 项目名：client-tau-lime-93

### Q: 部署失败
A: 检查：
- vercel.json 格式是否正确
- index.html 是否在根目录
- GitHub 仓库是否公开

## 当前状态

✅ DNS 配置正确：minduniversity.yndxw.com → cname.vercel-dns.com
✅ 本地文件完整：index.html (80K)
✅ vercel.json 已修复（JSON 格式正确）
❌ 原始 Vercel 项目无法访问
⏳ 等待创建新的 Vercel 项目

## 下一步操作

1. 访问 https://vercel.com/new
2. 导入 GitHub 项目
3. 配置并部署
4. 添加自定义域名
5. 验证部署成功

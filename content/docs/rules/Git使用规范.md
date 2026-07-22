# Git 使用规范

## 分支管理

### 分支模型

我们采用 **Git Flow** 简化版分支模型：

```
main (生产分支)
  ↑
develop (开发分支)
  ↑
feature/* (功能分支)
hotfix/* (热修复分支)
```

### 分支命名规范

| 分支类型 | 命名格式 | 示例 |
|---------|---------|------|
| 功能分支 | `feature/功能描述` | `feature/user-auth` |
| 修复分支 | `fix/问题描述` | `fix/login-error` |
| 热修复 | `hotfix/问题描述` | `hotfix/critical-bug` |
| 发布分支 | `release/版本号` | `release/v1.2.0` |

## 提交规范

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| 类型 | 说明 |
|-----|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档更新 |
| `style` | 代码格式调整（不影响功能） |
| `refactor` | 重构代码 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具相关 |

### 示例

```bash
# 功能提交
git commit -m "feat(auth): 添加用户登录功能

- 实现 JWT Token 验证
- 添加登录页面
- 集成第三方登录"

# 修复提交
git commit -m "fix(api): 修复用户列表分页错误

修复当总页数为0时的空指针异常"
```

## 工作流程

### 1. 开始新功能

```bash
# 从 develop 分支创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 开发完成后
git add .
git commit -m "feat(scope): 描述"
git push origin feature/my-feature

# 创建 Pull Request 合并到 develop
```

### 2. 代码审查

- 所有代码必须通过 Pull Request 合并
- 至少需要 1 人审查通过
- CI 检查必须通过

### 3. 发布流程

```bash
# 从 develop 创建发布分支
git checkout -b release/v1.2.0 develop

# 版本修复（如有需要）
git commit -m "fix: 修复发布版本中的问题"

# 合并到 main
git checkout main
git merge --no-ff release/v1.2.0
git tag -a v1.2.0 -m "版本 1.2.0"

# 合并回 develop
git checkout develop
git merge --no-ff release/v1.2.0
```

## 常用命令速查

```bash
# 查看状态
git status

# 查看分支
git branch -a

# 切换分支
git checkout branch-name

# 拉取最新代码
git pull origin branch-name

# 推送代码
git push origin branch-name

# 撤销修改
git checkout -- file-name      # 撤销文件修改
git reset --soft HEAD~1       # 撤销最后一次提交（保留修改）
git reset --hard HEAD~1       # 撤销最后一次提交（丢弃修改）
```

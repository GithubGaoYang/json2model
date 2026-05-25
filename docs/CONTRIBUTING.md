# Git 提交规范

本文档定义了本项目的 Git 提交规范，所有贡献者必须遵守。

## 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type（必填）

提交类型，必须是以下之一：

| 类型 | 说明 |
|------|------|
| `feat` | 新功能（feature） |
| `fix` | 修复 bug |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响代码运行的变动） |
| `refactor` | 重构（既不是新增功能，也不是修复 bug） |
| `perf` | 性能优化 |
| `test` | 增加测试 |
| `chore` | 构建过程或辅助工具的变动 |
| `revert` | 回滚到上一个版本 |

### Scope（可选）

提交影响的范围，可以是：

- `converter` - 转换器核心逻辑
- `ui` - 用户界面
- `arkts` - ArkTS 转换器
- `swift` - Swift 转换器
- `deps` - 依赖更新
- `docs` - 文档

### Subject（必填）

提交的简短描述，不超过 50 个字符：

- 使用中文或英文（推荐中文）
- 首字母不大写
- 结尾不加句号
- 使用祈使句语气（如"添加"而非"添加了"）

### Body（可选）

详细描述，可以分成多行：

- 说明代码变动的动机
- 与之前行为的对比
- 每行不超过 72 个字符

### Footer（可选）

- **Breaking Changes**：不兼容变动说明
- **Closes**：关闭的 Issue 编号

## 提交示例

### 功能添加
```
feat(converter): 支持 JSON 数组作为根输入

- 添加对根数组的处理逻辑
- 合并数组中所有对象的字段
- 生成统一的 RootItem 类定义
```

### Bug 修复
```
fix(arkts): 修复嵌套对象数组类型定义错误

修复嵌套对象数组类型被错误生成为单一对象类型的问题。
现在正确生成二维数组类型定义。
```

### 重构
```
refactor(converter): 重构代码结构，提取公共基类

- 提取 JsonConverterBase 基类，消除重复代码
- 统一 convert、processObject、processObjectArray 等通用逻辑
- 使用类型处理器数组简化类型判断逻辑
- 代码行数从 1018 行减少到 566 行（-44%）
```

### 文档更新
```
docs: 添加项目说明文档

- 添加 README.md
- 添加使用说明和示例
- 添加浏览器兼容性说明
```

### 依赖更新
```
deps: 本地化所有 CDN 资源

- 下载 Vue.js、ElementUI、Highlight.js 到 lib/ 目录
- 修改 index.html 引用本地资源
- 移除所有外部网络依赖
```

## 提交前检查清单

- [ ] 代码已通过本地测试
- [ ] 提交信息符合规范
- [ ] 没有包含不必要的文件
- [ ] 没有提交敏感信息

## 分支管理

### 主分支

- `main`：主分支，保持稳定可发布状态

### 开发流程

1. 从 `main` 创建功能分支：`git checkout -b feat/xxx`
2. 开发完成后提交：`git commit -m "feat: xxx"`
3. 合并到 `main`：`git checkout main && git merge feat/xxx`

## 版本号规则

采用语义化版本控制（SemVer）：

```
主版本号.次版本号.修订号
```

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能新增
- **修订号**：向下兼容的问题修复

## 参考

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

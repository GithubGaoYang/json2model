# JSON 转 Model 转换器

一款纯前端、离线可用的 JSON 转代码模型生成工具，支持 ArkTS 和 Swift 语言。

## 功能特性

- **多语言支持**：支持生成 ArkTS (TypeScript) 和 Swift 模型代码
- **离线可用**：所有依赖已本地化，无需网络连接
- **嵌套对象处理**：自动识别嵌套对象并生成对应的类定义
- **数组类型推断**：智能推断数组元素类型（基础类型或对象类型）
- **字段合并**：处理对象数组时自动合并所有对象的字段
- **语法高亮**：生成的代码支持语法高亮显示
- **代码折叠**：支持折叠/展开生成的类代码
- **一键复制**：支持复制单个类或全部代码
- **本地存储**：自动保存语言选择偏好
- **Swift 驼峰命名**：支持自动将 Swift 模型字段转为小驼峰命名

## 技术栈

- **Vue 2.6.14**：响应式前端框架
- **Element UI 2.15.14**：UI 组件库
- **Highlight.js 11.9.0**：代码语法高亮
- **原生 JavaScript**：核心转换逻辑

## 项目结构

```
json/
├── index.html          # 主页面
├── app.js              # Vue 应用逻辑
├── converter.js        # JSON 转换器核心（ArkTS/Swift）
├── style.css           # 样式文件
├── lib/                # 本地依赖库
│   ├── element-ui/     # Element UI
│   ├── highlight.js/   # Highlight.js
│   └── vue/            # Vue.js
└── docs/               # 文档
    ├── CONTRIBUTING.md # Git 提交规范
    ├── AI_CODE_PROMPT.md   # AI 代码生成规则
    └── AI_TEST_PROMPT.md   # AI 测试规则
```

## 快速开始

### 方式一：直接打开

直接在浏览器中打开 `index.html` 文件即可使用。

### 方式二：本地服务器

```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx serve .

# 然后访问 http://localhost:8080
```

## 使用方法

1. **输入 JSON**：在左侧输入框粘贴 JSON 数据
2. **选择语言**：点击"设置"按钮选择目标语言（ArkTS/Swift）
3. **配置选项**：选择 Swift 语言时，可配置"自动驼峰命名"选项
4. **点击转换**：点击"转换"按钮
5. **查看结果**：右侧显示生成的模型代码
6. **复制代码**：点击"复制代码"按钮复制单个类或全部代码

### Swift 驼峰命名选项

当目标语言选择 **Swift** 时，设置弹窗会显示"自动驼峰命名"选项：

- **开启**：字段名自动转为小驼峰命名（如 `user_name` → `userName`）
- **关闭**：字段名保持原样（如 `user_name` 保持为 `user_name`）

该设置会自动保存到本地存储。

## 支持的 JSON 格式

### 标准对象
```json
{
  "User": {
    "id": 123,
    "name": "张三",
    "email": "zhangsan@example.com"
  }
}
```

### 根数组
```json
[
  {"name": "Alice", "age": 25},
  {"name": "Bob", "email": "bob@test.com"}
]
```

### 嵌套对象
```json
{
  "Company": {
    "name": "Tech Corp",
    "address": {
      "street": "Main St",
      "city": "Beijing"
    }
  }
}
```

### 对象数组
```json
{
  "users": [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob", "email": "bob@test.com"}
  ]
}
```

## 输出示例

### ArkTS 输出
```typescript
import { Type, Transform } from 'class-transformer';

export class User {
  @Type(() => Number)
  @Transform((params) => params.value ?? 0)
  id: number = 0;

  @Type(() => String)
  @Transform((params) => params.value ?? '')
  name: string = '';
}
```

### Swift 输出（关闭自动驼峰）

```swift
import SwiftyJSON

struct User {
    var user_id = 0
    var user_name = ""
    
    init() {}
    
    init?(json: JSON) {
        guard json.type == .dictionary else { return nil }
        
        user_id = json["user_id"].intValue
        user_name = json["user_name"].stringValue
    }
}
```

### Swift 输出（开启自动驼峰）

```swift
import SwiftyJSON

struct User {
    var userId = 0
    var userName = ""
    
    init() {}
    
    init?(json: JSON) {
        guard json.type == .dictionary else { return nil }
        
        userId = json["user_id"].intValue
        userName = json["user_name"].stringValue
    }
}
```

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 许可证

MIT License

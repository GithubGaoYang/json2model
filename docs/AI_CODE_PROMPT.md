# AI 代码生成规则

本文档定义了 AI 助手在为本项目生成代码时必须遵守的规则。

## 基本原则

1. **保留现有逻辑**：尽可能保留原有代码逻辑，避免不必要的改动
2. **代码复用**：优先复用现有代码，避免重复
3. **清晰可读**：代码结构清晰，命名有意义
4. **性能优先**：在不影响可读性的前提下优化性能
5. **健壮性**：处理边界情况和异常输入

## 项目架构

### 核心类结构

```
JsonConverterBase (基类)
├── convert()              # 主转换入口
├── processObject()        # 处理对象
├── processObjectArray()   # 处理对象数组
├── _mergeArrayFields()    # 合并数组字段
├── toPascalCase()         # 转大驼峰
├── toCamelCase()          # 转小驼峰
└── _generateOutput()      # 生成输出（抽象）

JsonToArkTSConverter (继承)
├── _getFieldInfo()        # ArkTS 类型映射
├── _getArrayTypeInfo()    # 数组类型处理
└── _generateClassCode()   # 生成 ArkTS 类代码

JsonToSwiftConverter (继承)
├── _getFieldInfo()        # Swift 类型映射
├── _getArrayTypeInfo()    # 数组类型处理
└── _generateClassCode()   # 生成 Swift 类代码
```

## 编码规范

### JavaScript

#### 命名规范

- **类名**：大驼峰（PascalCase），如 `JsonConverterBase`
- **方法名**：小驼峰（camelCase），如 `processObject`
- **私有方法**：下划线前缀，如 `_getFieldInfo`
- **常量**：全大写下划线，如 `DEFAULT_LANGUAGE`

#### 代码风格

```javascript
// 使用 class 语法
class MyClass {
    constructor() {
        this.property = value;
    }

    // 公有方法
    publicMethod() {
        return this._privateMethod();
    }

    // 私有方法
    _privateMethod() {
        // ...
    }
}

// 使用箭头函数处理回调
array.map(item => this.process(item));

// 使用解构
const { name, type } = field;

// 使用模板字符串
const className = `${fieldName}Item`;
```

#### 注释规范

```javascript
/**
 * 方法描述
 * @param {string} param1 - 参数1说明
 * @param {Object} param2 - 参数2说明
 * @returns {string} - 返回值说明
 */
methodName(param1, param2) {
    // 实现
}
```

### HTML

#### 规范

- 使用语义化标签
- 属性使用双引号
- 自闭合标签不加斜杠

```html
<!-- 正确 -->
<div class="container">
    <el-input v-model="value" placeholder="提示"></el-input>
</div>

<!-- 错误 -->
<div class='container'>
    <el-input v-model='value' />
</div>
```

### CSS

#### 规范

- 使用小写和连字符命名
- 属性按字母顺序排列（可选）
- 使用简写属性

```css
/* 正确 */
.my-class {
    display: flex;
    margin: 10px 20px;
    padding: 0;
}

/* 错误 */
.MyClass {
    margin-top: 10px;
    margin-right: 20px;
    margin-bottom: 10px;
    margin-left: 20px;
}
```

## 类型映射规则

### ArkTS 类型映射

| JSON 类型 | ArkTS 类型 | 默认值 |
|-----------|-----------|--------|
| string | string | `""` |
| number (整数) | number | `0` |
| number (浮点) | number | `0` |
| boolean | boolean | `false` |
| null | string | `""` |
| object | 类名 | `undefined` |
| array | 类型[] | `[]` |

### Swift 类型映射

| JSON 类型 | Swift 类型 | 默认值 |
|-----------|-----------|--------|
| string | String | `""` |
| number (整数) | Int | `0` |
| number (浮点) | Double | `0.0` |
| boolean | Bool | `false` |
| null | String | `""` |
| object | 类名? | `nil` |
| array | [类型] | `[]` |

## 代码生成模板

### 新增语言支持

如需添加新语言支持，按以下步骤：

1. **创建转换器类**

```javascript
class JsonToNewLangConverter extends JsonConverterBase {
    _getFieldInfo(value, fieldName) {
        // 实现类型映射逻辑
    }

    _generateOutput() {
        // 实现输出生成逻辑
    }
}
```

2. **注册转换器**

```javascript
window.JsonToNewLangConverter = JsonToNewLangConverter;
```

3. **添加 UI 支持**

在 `app.js` 和 `index.html` 中添加新语言选项。

## 注意事项

### 不要做的事

- ❌ 不要修改基类 `JsonConverterBase` 的核心逻辑，除非必要
- ❌ 不要破坏向后兼容性
- ❌ 不要引入外部网络依赖
- ❌ 不要使用已弃用的 API

### 要做的事

- ✅ 添加适当的错误处理
- ✅ 为新功能添加示例
- ✅ 更新相关文档
- ✅ 遵循现有代码风格

## 示例提示词

### 添加新功能

```
为 converter.js 添加对嵌套数组（二维数组）的支持。

要求：
1. 在 JsonConverterBase 中添加处理嵌套数组的方法
2. ArkTS 输出类型应为 Type[][]
3. Swift 输出类型应为 [[Type]]
4. 保持与现有代码风格一致
5. 添加适当的注释
```

### 修复 Bug

```
修复 converter.js 中处理空数组时的错误。

当前问题：空数组被错误地推断为字符串数组
期望行为：根据上下文推断或使用 any[]/Any

要求：
1. 保留现有逻辑
2. 添加边界情况处理
3. 不要影响性能
```

### 重构代码

```
重构 converter.js 中的类型处理逻辑。

当前问题：类型判断代码重复且难以维护
期望：使用策略模式或查表法简化

要求：
1. 保留所有现有功能
2. 提高代码可读性
3. 减少重复代码
4. 添加单元测试（如适用）
```

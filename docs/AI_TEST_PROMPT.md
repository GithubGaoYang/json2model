# AI 测试规则

本文档定义了 AI 助手在为本项目生成测试代码时必须遵守的规则。

## 测试原则

1. **覆盖核心逻辑**：重点测试转换器的核心功能
2. **边界情况**：测试空值、空数组、异常输入等边界情况
3. **多语言一致性**：确保 ArkTS 和 Swift 转换器行为一致
4. **可重复性**：测试用例应可重复运行
5. **独立性**：测试之间不应相互依赖

## 测试范围

### 必须测试的功能

- [ ] JSON 对象解析
- [ ] JSON 数组解析
- [ ] 嵌套对象处理
- [ ] 对象数组处理
- [ ] 基础类型映射（string/number/boolean/null）
- [ ] 数组类型推断
- [ ] 字段命名转换（snake_case → PascalCase/camelCase）
- [ ] 空输入处理
- [ ] 无效 JSON 处理

### 可选测试的功能

- [ ] 性能测试（大 JSON 文件）
- [ ] UI 交互测试
- [ ] 浏览器兼容性测试

## 测试用例设计

### 测试用例模板

```javascript
// 测试描述：测试 [功能] 在 [条件] 下的行为
{
    name: '测试名称',
    input: {
        json: '{"key": "value"}',
        language: 'arkts' // 或 'swift'
    },
    expected: {
        success: true,
        classes: ['Root'],
        fields: {
            'Root': ['key']
        }
    }
}
```

### 标准测试用例集

#### 1. 基础类型测试

```javascript
const basicTypeTests = [
    {
        name: '字符串类型',
        json: '{"name": "test"}',
        expected: { type: 'string', defaultValue: '""' }
    },
    {
        name: '整数类型',
        json: '{"count": 42}',
        expected: { type: 'number', defaultValue: '0' }
    },
    {
        name: '浮点数类型',
        json: '{"price": 19.99}',
        expected: { type: 'number', defaultValue: '0' }
    },
    {
        name: '布尔类型',
        json: '{"active": true}',
        expected: { type: 'boolean', defaultValue: 'false' }
    },
    {
        name: 'null 类型',
        json: '{"value": null}',
        expected: { type: 'string', defaultValue: '""' }
    }
];
```

#### 2. 数组类型测试

```javascript
const arrayTypeTests = [
    {
        name: '字符串数组',
        json: '{"tags": ["a", "b"]}',
        expected: { type: 'string[]', elementType: 'string' }
    },
    {
        name: '数字数组',
        json: '{"scores": [1, 2, 3]}',
        expected: { type: 'number[]', elementType: 'number' }
    },
    {
        name: '对象数组',
        json: '{"users": [{"id": 1}]}',
        expected: { 
            type: 'UsersItem[]', 
            elementType: 'UsersItem',
            nestedClass: true 
        }
    },
    {
        name: '空数组',
        json: '{"items": []}',
        expected: { type: 'string[]', defaultValue: '[]' }
    }
];
```

#### 3. 嵌套对象测试

```javascript
const nestedObjectTests = [
    {
        name: '单层嵌套',
        json: '{"user": {"name": "test"}}',
        expected: {
            classes: ['Root', 'User'],
            nestedField: { name: 'user', type: 'User' }
        }
    },
    {
        name: '多层嵌套',
        json: '{"company": {"address": {"city": "Beijing"}}}',
        expected: {
            classes: ['Root', 'Company', 'Address'],
            depth: 3
        }
    }
];
```

#### 4. 根数组测试

```javascript
const rootArrayTests = [
    {
        name: '对象数组作为根',
        json: '[{"id": 1}, {"id": 2, "name": "test"}]',
        expected: {
            rootClass: 'RootItem',
            fields: ['id', 'name'] // 应合并所有字段
        }
    },
    {
        name: '空数组',
        json: '[]',
        expected: { error: 'JSON 数组为空' }
    },
    {
        name: '非对象数组',
        json: '[1, 2, 3]',
        expected: { error: 'JSON 数组元素必须是对象' }
    }
];
```

#### 5. 命名转换测试

```javascript
const namingTests = [
    {
        name: '下划线命名',
        json: '{"user_name": "test", "user_age": 25}',
        expected: {
            arkts: { fields: ['user_name'], className: 'Root' },
            swift: { fields: ['userName'], className: 'Root' }
        }
    },
    {
        name: '驼峰命名',
        json: '{"userName": "test"}',
        expected: {
            arkts: { fields: ['userName'], className: 'Root' },
            swift: { fields: ['userName'], className: 'Root' }
        }
    },
    {
        name: '帕斯卡命名',
        json: '{"UserName": "test"}',
        expected: {
            className: 'Root',
            nested: { field: 'UserName', className: 'UserName' }
        }
    }
];
```

## 测试框架

### 使用 Jest（推荐）

```javascript
// converter.test.js
const { JsonToArkTSConverter, JsonToSwiftConverter } = require('./converter');

describe('JSON 转换器测试', () => {
    let arktsConverter;
    let swiftConverter;

    beforeEach(() => {
        arktsConverter = new JsonToArkTSConverter();
        swiftConverter = new JsonToSwiftConverter();
    });

    describe('基础类型', () => {
        test('字符串类型应正确映射', () => {
            const result = arktsConverter.convert('{"name": "test"}');
            expect(result.classes[0].code).toContain('name: string');
        });

        test('数字类型应正确映射', () => {
            const result = arktsConverter.convert('{"age": 25}');
            expect(result.classes[0].code).toContain('age: number');
        });
    });

    describe('错误处理', () => {
        test('无效 JSON 应抛出错误', () => {
            expect(() => {
                arktsConverter.convert('invalid json');
            }).toThrow('JSON 解析失败');
        });

        test('空对象应抛出错误', () => {
            expect(() => {
                arktsConverter.convert('{}');
            }).toThrow('JSON 对象为空');
        });
    });
});
```

### 使用原生 JavaScript

```javascript
// test.js
function runTests() {
    const tests = [];
    
    function test(name, fn) {
        tests.push({ name, fn });
    }
    
    function expect(actual) {
        return {
            toBe(expected) {
                if (actual !== expected) {
                    throw new Error(`期望 ${expected}，实际 ${actual}`);
                }
            },
            toContain(expected) {
                if (!actual.includes(expected)) {
                    throw new Error(`期望包含 ${expected}`);
                }
            },
            toThrow(expected) {
                try {
                    actual();
                    throw new Error(`期望抛出错误 ${expected}`);
                } catch (e) {
                    if (!e.message.includes(expected)) {
                        throw new Error(`期望错误包含 ${expected}，实际 ${e.message}`);
                    }
                }
            }
        };
    }
    
    // 运行测试
    let passed = 0;
    let failed = 0;
    
    for (const { name, fn } of tests) {
        try {
            fn();
            console.log(`✓ ${name}`);
            passed++;
        } catch (e) {
            console.log(`✗ ${name}: ${e.message}`);
            failed++;
        }
    }
    
    console.log(`\n总计: ${passed} 通过, ${failed} 失败`);
}

// 导出测试函数
window.runConverterTests = runTests;
```

## 测试验证清单

### 提交前必须验证

- [ ] 所有核心功能测试通过
- [ ] 边界情况测试通过
- [ ] 错误处理测试通过
- [ ] 新旧测试用例都通过

### 新增功能时必须添加

- [ ] 对应功能的测试用例
- [ ] 边界情况测试
- [ ] 错误处理测试
- [ ] 更新测试文档

## 性能测试

### 大文件测试

```javascript
function generateLargeJSON(size) {
    const obj = {};
    for (let i = 0; i < size; i++) {
        obj[`field${i}`] = {
            id: i,
            name: `name${i}`,
            value: Math.random()
        };
    }
    return JSON.stringify(obj);
}

function performanceTest() {
    const sizes = [100, 500, 1000];
    
    for (const size of sizes) {
        const json = generateLargeJSON(size);
        const start = performance.now();
        
        const converter = new JsonToArkTSConverter();
        converter.convert(json);
        
        const end = performance.now();
        console.log(`${size} 个字段: ${(end - start).toFixed(2)}ms`);
    }
}
```

## 示例提示词

### 生成测试用例

```
为 converter.js 生成完整的测试用例。

要求：
1. 覆盖所有基础类型（string/number/boolean/null）
2. 覆盖数组类型（基础类型数组、对象数组、嵌套数组）
3. 覆盖嵌套对象（单层、多层）
4. 覆盖错误情况（无效 JSON、空对象、空数组）
5. 使用原生 JavaScript 实现，不依赖外部测试框架
6. 输出到 test/converter.test.js
```

### 验证修复

```
验证以下 bug 修复是否有效。

Bug 描述：处理对象数组时，只使用第一个对象的字段
修复方案：合并所有对象的字段

要求：
1. 编写测试用例验证修复
2. 测试用例应包含：
   - 第一个对象有字段 A
   - 第二个对象有字段 A 和 B
   - 验证生成的类包含 A 和 B
3. 测试应通过
```

### 回归测试

```
为最近的代码重构生成回归测试。

重构内容：提取 JsonConverterBase 基类

要求：
1. 确保重构前后行为一致
2. 测试 ArkTS 和 Swift 转换器的输出
3. 验证所有现有功能正常工作
4. 生成测试报告
```

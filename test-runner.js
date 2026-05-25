/**
 * JSON 转换器测试脚本
 * 根据 AI_TEST_PROMPT.md 要求执行测试
 */

// 模拟浏览器环境
const fs = require('fs');

// 读取 converter.js 内容
const converterCode = fs.readFileSync('./converter.js', 'utf8');

// 创建一个模拟的 window 对象
const mockWindow = {};

// 执行 converter.js
const func = new Function('window', converterCode);
func(mockWindow);

// 获取转换器类
const JsonToArkTSConverter = mockWindow.JsonToArkTSConverter;
const JsonToSwiftConverter = mockWindow.JsonToSwiftConverter;

// 测试结果统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const errors = [];

function test(name, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`✓ ${name}`);
    } catch (e) {
        failedTests++;
        console.log(`✗ ${name}: ${e.message}`);
        errors.push({ name, error: e.message });
    }
}

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) {
                throw new Error(`期望 ${expected}，实际 ${actual}`);
            }
        },
        toContain(expected) {
            if (typeof actual === 'string' && !actual.includes(expected)) {
                throw new Error(`期望包含 "${expected}"`);
            } else if (Array.isArray(actual) && !actual.includes(expected)) {
                throw new Error(`期望数组包含 ${expected}`);
            }
        },
        toEqual(expected) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
            }
        },
        toThrow(expectedError) {
            try {
                actual();
                throw new Error(`期望抛出错误，但没有抛出`);
            } catch (e) {
                if (!e.message.includes(expectedError)) {
                    throw new Error(`期望错误包含 "${expectedError}"，实际 "${e.message}"`);
                }
            }
        }
    };
}

console.log('========================================');
console.log('JSON 转换器测试');
console.log('========================================\n');

// 1. 基础类型测试
console.log('【1. 基础类型测试】');

const arktsConverter = new JsonToArkTSConverter();
const swiftConverter = new JsonToSwiftConverter();

test('ArkTS: 字符串类型应正确映射', () => {
    const result = arktsConverter.convert('{"name": "test"}');
    expect(result.classes[0].code).toContain('name: string');
});

test('ArkTS: 数字类型应正确映射', () => {
    const result = arktsConverter.convert('{"age": 25}');
    expect(result.classes[0].code).toContain('age: number');
});

test('ArkTS: 布尔类型应正确映射', () => {
    const result = arktsConverter.convert('{"active": true}');
    expect(result.classes[0].code).toContain('active: boolean');
});

test('ArkTS: null 类型应映射为 string', () => {
    const result = arktsConverter.convert('{"value": null}');
    expect(result.classes[0].code).toContain('value: string');
});

test('Swift: 字符串类型应正确映射', () => {
    const result = swiftConverter.convert('{"name": "test"}');
    expect(result.classes[0].code).toContain('var name = ""');
});

test('Swift: 整数类型应映射为 Int', () => {
    const result = swiftConverter.convert('{"count": 42}');
    expect(result.classes[0].code).toContain('var count = 0');
});

test('Swift: 浮点数类型应映射为 Double', () => {
    const result = swiftConverter.convert('{"price": 19.99}');
    expect(result.classes[0].code).toContain('var price = 0.0');
});

test('Swift: 布尔类型应映射为 Bool', () => {
    const result = swiftConverter.convert('{"active": true}');
    expect(result.classes[0].code).toContain('var active = false');
});

console.log('');

// 2. 数组类型测试
console.log('【2. 数组类型测试】');

test('ArkTS: 字符串数组应正确映射', () => {
    const result = arktsConverter.convert('{"tags": ["a", "b"]}');
    expect(result.classes[0].code).toContain('tags: string[]');
});

test('ArkTS: 数字数组应正确映射', () => {
    const result = arktsConverter.convert('{"scores": [1, 2, 3]}');
    expect(result.classes[0].code).toContain('scores: number[]');
});

test('ArkTS: 对象数组应生成嵌套类', () => {
    const result = arktsConverter.convert('{"users": [{"id": 1}]}');
    expect(result.classes.length).toBe(2); // Root 和 UsersItem
    expect(result.classes.map(c => c.name)).toContain('UsersItem');
});

test('ArkTS: 空数组应默认映射为 string[]', () => {
    const result = arktsConverter.convert('{"items": []}');
    expect(result.classes[0].code).toContain('items: string[]');
});

test('Swift: 字符串数组应正确映射', () => {
    const result = swiftConverter.convert('{"tags": ["a", "b"]}');
    expect(result.classes[0].code).toContain('var tags = [String]()');
});

test('Swift: 整数数组应正确映射', () => {
    const result = swiftConverter.convert('{"scores": [1, 2, 3]}');
    expect(result.classes[0].code).toContain('var scores = [Int]()');
});

test('Swift: 对象数组应生成嵌套类', () => {
    const result = swiftConverter.convert('{"users": [{"id": 1}]}');
    expect(result.classes.length).toBe(2);
    expect(result.classes.map(c => c.name)).toContain('UsersItem');
});

console.log('');

// 3. 嵌套对象测试
console.log('【3. 嵌套对象测试】');

test('ArkTS: 单层嵌套应生成嵌套类', () => {
    const result = arktsConverter.convert('{"user": {"name": "test"}}');
    expect(result.classes.length).toBe(2);
    expect(result.classes.map(c => c.name)).toContain('User');
});

test('ArkTS: 多层嵌套应生成多级类', () => {
    const result = arktsConverter.convert('{"company": {"address": {"city": "Beijing"}}}');
    expect(result.classes.length).toBe(3);
    expect(result.classes.map(c => c.name)).toContain('Company');
    expect(result.classes.map(c => c.name)).toContain('Address');
});

test('Swift: 单层嵌套应生成嵌套类', () => {
    const result = swiftConverter.convert('{"user": {"name": "test"}}');
    expect(result.classes.length).toBe(2);
    expect(result.classes.map(c => c.name)).toContain('User');
});

test('Swift: 嵌套对象应使用可选类型', () => {
    const result = swiftConverter.convert('{"user": {"name": "test"}}');
    const rootCode = result.classes.find(c => c.name === 'Root').code;
    expect(rootCode).toContain('var user: User?');
});

console.log('');

// 4. 根数组测试
console.log('【4. 根数组测试】');

test('ArkTS: 对象数组作为根应生成 RootItem 类', () => {
    const result = arktsConverter.convert('[{"id": 1}, {"id": 2, "name": "test"}]');
    expect(result.classes[0].name).toBe('RootItem');
});

test('ArkTS: 根数组应合并所有对象字段', () => {
    const result = arktsConverter.convert('[{"id": 1}, {"id": 2, "name": "test"}]');
    const code = result.classes[0].code;
    expect(code).toContain('id');
    expect(code).toContain('name');
});

test('Swift: 对象数组作为根应生成 RootItem 类', () => {
    const result = swiftConverter.convert('[{"id": 1}]');
    expect(result.classes[0].name).toBe('RootItem');
});

test('空数组应抛出错误', () => {
    expect(() => arktsConverter.convert('[]')).toThrow('JSON 数组为空');
});

test('非对象数组应抛出错误', () => {
    expect(() => arktsConverter.convert('[1, 2, 3]')).toThrow('JSON 数组元素必须是对象');
});

console.log('');

// 5. 命名转换测试
console.log('【5. 命名转换测试】');

test('ArkTS: 应保留原始字段名', () => {
    const result = arktsConverter.convert('{"user_name": "test"}');
    expect(result.classes[0].code).toContain('user_name: string');
});

test('Swift: 应将下划线命名转为驼峰命名', () => {
    const result = swiftConverter.convert('{"user_name": "test"}');
    expect(result.classes[0].code).toContain('var userName = ""');
});

test('Swift: 嵌套类名应使用大驼峰', () => {
    const result = swiftConverter.convert('{"user_info": {"age": 25}}');
    expect(result.classes.map(c => c.name)).toContain('UserInfo');
});

console.log('');

// 6. 错误处理测试
console.log('【6. 错误处理测试】');

test('无效 JSON 应抛出错误', () => {
    expect(() => arktsConverter.convert('invalid json')).toThrow('JSON 解析失败');
});

test('空对象应抛出错误', () => {
    expect(() => arktsConverter.convert('{}')).toThrow('JSON 对象为空');
});

test('非对象非数组应抛出错误', () => {
    expect(() => arktsConverter.convert('"just a string"')).toThrow('JSON 必须是对象或数组');
});

test('数字应抛出错误', () => {
    expect(() => arktsConverter.convert('123')).toThrow('JSON 必须是对象或数组');
});

console.log('');

// 7. 类顺序测试
console.log('【7. 类顺序测试】');

test('嵌套类应在根类之前（依赖顺序）', () => {
    const result = arktsConverter.convert('{"user": {"name": "test"}}');
    const names = result.classes.map(c => c.name);
    // classOrder 内部顺序: [User, Root] (先定义的在前)
    // reverse() 后输出顺序: [Root, User] (依赖类在后)
    // 所以 Root 在索引 0，User 在索引 1
    const userIndex = names.indexOf('User');
    const rootIndex = names.indexOf('Root');
    // 依赖类 User 应该在后面（索引 1）
    expect(userIndex).toBe(1);
    expect(rootIndex).toBe(0);
    // 依赖类在数组后面（使用时需要先定义依赖类）
    expect(userIndex > rootIndex).toBe(true);
});

console.log('');

// 8. 导入语句测试
console.log('【8. 导入语句测试】');

test('ArkTS: 应包含 class-transformer 导入', () => {
    const result = arktsConverter.convert('{"name": "test"}');
    expect(result.importStatement).toContain('class-transformer');
});

test('Swift: 应包含 SwiftyJSON 导入', () => {
    const result = swiftConverter.convert('{"name": "test"}');
    expect(result.importStatement).toContain('SwiftyJSON');
});

console.log('');

// 测试总结
console.log('========================================');
console.log(`测试完成: ${totalTests} 个测试`);
console.log(`✓ 通过: ${passedTests}`);
console.log(`✗ 失败: ${failedTests}`);
console.log('========================================');

if (failedTests > 0) {
    console.log('\n失败详情:');
    errors.forEach((e, i) => {
        console.log(`${i + 1}. ${e.name}`);
        console.log(`   错误: ${e.error}`);
    });
    process.exit(1);
} else {
    console.log('\n所有测试通过！');
    process.exit(0);
}

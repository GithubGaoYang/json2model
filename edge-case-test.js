/**
 * 边界情况测试
 * 测试 _mergeArrayFields 的各种边界情况
 */

const fs = require('fs');
const code = fs.readFileSync('./converter.js', 'utf8');
const mockWindow = {};
new Function('window', code)(mockWindow);

const JsonToArkTSConverter = mockWindow.JsonToArkTSConverter;

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`✓ ${name}`);
    } catch (e) {
        console.log(`✗ ${name}: ${e.message}`);
    }
}

function expect(actual) {
    return {
        toContain(expected) {
            if (!actual.includes(expected)) {
                throw new Error(`期望包含 "${expected}"`);
            }
        }
    };
}

console.log('========================================');
console.log('边界情况测试');
console.log('========================================\n');

const converter = new JsonToArkTSConverter();

// 测试 1: 三个对象数组合并
test('三个对象数组合并', () => {
    const result = converter.convert(`[
        {"items": [{"a": 1}]},
        {"items": [{"b": 2}]},
        {"items": [{"c": 3}]}
    ]`);
    const code = result.classes.find(c => c.name === 'ItemsItem').code;
    expect(code).toContain('a: number');
    expect(code).toContain('b: number');
    expect(code).toContain('c: number');
});

// 测试 2: 空数组 + 对象数组
test('空数组 + 对象数组', () => {
    const result = converter.convert(`[
        {"data": []},
        {"data": [{"x": 1}]}
    ]`);
    const code = result.classes.find(c => c.name === 'RootItem').code;
    expect(code).toContain('DataItem');
});

// 测试 3: 对象数组 + 空数组
test('对象数组 + 空数组', () => {
    const result = converter.convert(`[
        {"data": [{"x": 1}]},
        {"data": []}
    ]`);
    const code = result.classes.find(c => c.name === 'RootItem').code;
    expect(code).toContain('DataItem');
});

// 测试 4: 字符串数组 + 对象数组（类型不同）
test('字符串数组 + 对象数组', () => {
    const result = converter.convert(`[
        {"items": ["a", "b"]},
        {"items": [{"id": 1}]}
    ]`);
    // 应该保留第一个数组的类型（字符串数组）
    const code = result.classes.find(c => c.name === 'RootItem').code;
    expect(code).toContain('string[]');
});

// 测试 5: 对象数组 + 字符串数组
test('对象数组 + 字符串数组', () => {
    const result = converter.convert(`[
        {"items": [{"id": 1}]},
        {"items": ["a", "b"]}
    ]`);
    // 应该保留第一个数组的类型（对象数组）
    const code = result.classes.find(c => c.name === 'RootItem').code;
    expect(code).toContain('ItemsItem');
});

// 测试 6: 嵌套对象数组
test('嵌套对象数组', () => {
    const result = converter.convert(`[
        {"users": [{"profile": {"name": "a"}}]},
        {"users": [{"profile": {"age": 25}}]}
    ]`);
    const profileCode = result.classes.find(c => c.name === 'Profile').code;
    expect(profileCode).toContain('name: string');
    expect(profileCode).toContain('age: number');
});

// 测试 7: 多个字段的对象数组
test('多个字段的对象数组', () => {
    const result = converter.convert(`[
        {"items": [{"a": 1, "b": 2}]},
        {"items": [{"c": 3, "d": 4}]}
    ]`);
    const code = result.classes.find(c => c.name === 'ItemsItem').code;
    expect(code).toContain('a: number');
    expect(code).toContain('b: number');
    expect(code).toContain('c: number');
    expect(code).toContain('d: number');
});

// 测试 8: 混合类型数组（数字 + 字符串）
test('混合类型数组（数字 + 字符串）', () => {
    const result = converter.convert(`[
        {"values": [1, 2]},
        {"values": ["a", "b"]}
    ]`);
    // 应该保留第一个数组的类型
    const code = result.classes.find(c => c.name === 'RootItem').code;
    expect(code).toContain('number[]');
});

// 测试 9: 重复字段的对象数组
test('重复字段的对象数组', () => {
    const result = converter.convert(`[
        {"items": [{"id": 1, "name": "a"}]},
        {"items": [{"id": 2, "price": 10}]}
    ]`);
    const code = result.classes.find(c => c.name === 'ItemsItem').code;
    expect(code).toContain('id: number');
    expect(code).toContain('name: string');
    expect(code).toContain('price: number');
});

// 测试 10: 深层嵌套数组
test('深层嵌套数组', () => {
    const result = converter.convert(`[
        {"matrix": [[{"x": 1}]]},
        {"matrix": [[{"y": 2}]]}
    ]`);
    const code = result.classes.find(c => c.name === 'MatrixItem').code;
    expect(code).toContain('x: number');
    expect(code).toContain('y: number');
});

console.log('\n========================================');
console.log(`测试完成: ${totalTests} 个测试`);
console.log(`✓ 通过: ${passedTests}`);
console.log(`✗ 失败: ${totalTests - passedTests}`);
console.log('========================================');

if (passedTests < totalTests) {
    process.exit(1);
} else {
    console.log('\n所有边界测试通过！');
    process.exit(0);
}

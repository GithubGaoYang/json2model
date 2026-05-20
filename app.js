/**
 * 主应用逻辑
 */
document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const arktsOutput = document.getElementById('arktsOutput');
    const convertBtn = document.getElementById('convertBtn');

    // 创建转换器实例
    const converter = new JsonToArkTSConverter();

    // 转换按钮点击事件
    convertBtn.addEventListener('click', () => {
        const jsonStr = jsonInput.value.trim();

        if (!jsonStr) {
            arktsOutput.value = '错误：请输入 JSON 内容';
            return;
        }

        try {
            const arktsCode = converter.convert(jsonStr);
            arktsOutput.value = arktsCode;
        } catch (error) {
            arktsOutput.value = `错误：${error.message}`;
        }
    });

    // 支持 Ctrl+Enter 或 Cmd+Enter 快捷键转换
    jsonInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            convertBtn.click();
        }
    });

    // 示例 JSON
    const exampleJson = `{
  "User": {
    "id": 123,
    "name": "张三",
    "email": "zhangsan@example.com",
    "is_active": true,
    "age": 25,
    "profile": {
      "avatar": "https://example.com/avatar.jpg",
      "bio": "这是个人简介"
    },
    "tags": ["开发者", "设计师"],
    "scores": [95, 87, 92],
    "settings": {
      "theme": "dark",
      "notifications_enabled": true
    }
  }
}`;

    // 设置示例 JSON
    jsonInput.value = exampleJson;
});

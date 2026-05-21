/**
 * 主应用逻辑
 */
document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const arktsOutput = document.getElementById('arktsOutput');
    const convertBtn = document.getElementById('convertBtn');
    const languageSelect = document.getElementById('languageSelect');
    const outputTitle = document.getElementById('outputTitle');

    // 创建转换器实例
    const arktsConverter = new JsonToArkTSConverter();
    const swiftConverter = new JsonToSwiftConverter();

    // 语言选择事件
    languageSelect.addEventListener('change', () => {
        const language = languageSelect.value;
        if (language === 'arkts') {
            outputTitle.textContent = 'ArkTS Model 输出';
        } else if (language === 'swift') {
            outputTitle.textContent = 'Swift Model 输出';
        }
        // 清空输出
        arktsOutput.innerHTML = '<div class="empty-hint">转换结果将显示在这里...</div>';
    });

    // 转换按钮点击事件
    convertBtn.addEventListener('click', () => {
        const jsonStr = jsonInput.value.trim();
        const language = languageSelect.value;

        if (!jsonStr) {
            showError('错误：请输入 JSON 内容');
            return;
        }

        try {
            let result;
            if (language === 'arkts') {
                result = arktsConverter.convert(jsonStr);
            } else if (language === 'swift') {
                result = swiftConverter.convert(jsonStr);
            }
            renderOutput(result, language);
        } catch (error) {
            showError(`错误：${error.message}`);
        }
    });

    // 支持 Ctrl+Enter 或 Cmd+Enter 快捷键转换
    jsonInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            convertBtn.click();
        }
    });

    /**
     * 渲染输出结果
     * @param {Object} result - 包含 importStatement 和 classes 的对象
     * @param {string} language - 语言类型
     */
    function renderOutput(result, language) {
        arktsOutput.innerHTML = '';

        // 添加导入语句块
        const importBlock = createCodeBlock('Import', result.importStatement, language);
        arktsOutput.appendChild(importBlock);

        // 添加每个类的代码块
        result.classes.forEach(classInfo => {
            const codeBlock = createCodeBlock(classInfo.name, classInfo.code, language);
            arktsOutput.appendChild(codeBlock);
        });
    }

    /**
     * 创建代码块元素
     * @param {string} title - 标题
     * @param {string} code - 代码内容
     * @param {string} language - 语言类型
     * @returns {HTMLElement} - 代码块元素
     */
    function createCodeBlock(title, code, language) {
        const block = document.createElement('div');
        block.className = 'code-block';

        const header = document.createElement('div');
        header.className = 'code-header';

        const titleEl = document.createElement('div');
        titleEl.className = 'code-title';
        titleEl.textContent = title;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '复制代码';
        copyBtn.onclick = () => copyCode(copyBtn, code);

        header.appendChild(titleEl);
        header.appendChild(copyBtn);

        const content = document.createElement('div');
        content.className = 'code-content';
        
        // 创建 pre 和 code 元素用于语法高亮
        const pre = document.createElement('pre');
        const codeEl = document.createElement('code');
        const langClass = language === 'swift' ? 'language-swift' : 'language-typescript';
        codeEl.className = langClass;
        codeEl.textContent = code;
        
        pre.appendChild(codeEl);
        content.appendChild(pre);
        
        // 应用语法高亮
        if (window.hljs) {
            hljs.highlightElement(codeEl);
        }

        block.appendChild(header);
        block.appendChild(content);

        return block;
    }

    /**
     * 复制代码到剪贴板
     * @param {HTMLElement} btn - 按钮元素
     * @param {string} code - 要复制的代码
     */
    async function copyCode(btn, code) {
        try {
            await navigator.clipboard.writeText(code);
            const originalText = btn.textContent;
            btn.textContent = '已复制！';
            btn.classList.add('copied');

            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('copied');
            }, 2000);
        } catch (error) {
            console.error('复制失败:', error);
            alert('复制失败，请手动复制');
        }
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误信息
     */
    function showError(message) {
        arktsOutput.innerHTML = `<div class="empty-hint" style="color: #dc3545;">${message}</div>`;
    }

    // 示例 JSON
    const exampleJson = `{
  "User": {
    "id": 123,
    "name": "张三",
    "email": "zhangsan@example.com",
    "is_active": true,
    "age": 25,
    "score": 95.5,
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

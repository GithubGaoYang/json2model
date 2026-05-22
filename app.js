/**
 * Vue应用 - JSON转Model转换器
 */
new Vue({
    el: '#app',
    data: {
        jsonInput: '',
        selectedLanguage: 'arkts',
        outputClasses: [],
        converting: false,
        // 转换器实例
        arktsConverter: null,
        swiftConverter: null,
        // 示例JSON
        exampleJson: `{
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
}`
    },
    computed: {
        outputTitle() {
            return this.selectedLanguage === 'arkts' ? 'ArkTS Model输出' : 'Swift Model输出';
        },
        codeLanguageClass() {
            return this.selectedLanguage === 'swift' ? 'language-swift' : 'language-typescript';
        }
    },
    mounted() {
        // 初始化转换器
        this.arktsConverter = new JsonToArkTSConverter();
        this.swiftConverter = new JsonToSwiftConverter();
        
        // 设置示例JSON
        this.jsonInput = this.exampleJson;
    },
    methods: {
        /**
         * 清空输入
         */
        clearInput() {
            this.jsonInput = '';
        },
        
        /**
         * 语言切换
         */
        onLanguageChange() {
            this.outputClasses = [];
        },
        
        /**
         * 转换JSON
         */
        convert() {
            const jsonStr = this.jsonInput.trim();
            
            if (!jsonStr) {
                this.$message.error('请输入 JSON 内容');
                return;
            }
            
            this.converting = true;
            
            // 使用setTimeout模拟异步，避免阻塞UI
            setTimeout(() => {
                try {
                    let result;
                    if (this.selectedLanguage === 'arkts') {
                        result = this.arktsConverter.convert(jsonStr);
                    } else if (this.selectedLanguage === 'swift') {
                        result = this.swiftConverter.convert(jsonStr);
                    }
                    
                    // 处理输出结果
                    this.outputClasses = [
                        {
                            name: 'Import',
                            code: result.importStatement,
                            highlightedCode: this.highlightCode(result.importStatement)
                        },
                        ...result.classes.map(classInfo => ({
                            name: classInfo.name,
                            code: classInfo.code,
                            highlightedCode: this.highlightCode(classInfo.code)
                        }))
                    ];
                    
                    this.$message.success('转换成功！');
                } catch (error) {
                    this.$message.error(`转换失败: ${error.message}`);
                    this.outputClasses = [];
                } finally {
                    this.converting = false;
                }
            }, 100);
        },
        
        /**
         * 语法高亮
         */
        highlightCode(code) {
            if (window.hljs) {
                const language = this.selectedLanguage === 'swift' ? 'swift' : 'typescript';
                return hljs.highlight(code, { language }).value;
            }
            return code;
        },
        
        /**
         * 复制代码
         */
        async copyCode(code) {
            try {
                await navigator.clipboard.writeText(code);
                this.$message.success('复制成功！');
            } catch (error) {
                console.error('复制失败:', error);
                this.$message.error('复制失败，请手动复制');
            }
        }
    }
});

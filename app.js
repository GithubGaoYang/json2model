/**
 * Vue应用 - JSON转Model转换器
 */
new Vue({
    el: '#app',
    data: {
        jsonInput: '',
        selectedLanguage: 'arkts', // 默认值
        outputClasses: [],
        converting: false,
        settingsDialogVisible: false, // 设置弹窗显示状态
        // 设置选项
        autoCamelCase: false, // 自动驼峰命名（仅 Swift 有效）
        // 转换器实例
        arktsConverter: null,
        swiftConverter: null,
        // 折叠状态
        collapsedBlocks: {},
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
        // 从本地存储获取语言选择
        const storedLanguage = this.getStoredLanguage();
        if (storedLanguage) {
            this.selectedLanguage = storedLanguage;
        }
        
        // 从本地存储获取自动驼峰设置
        const storedAutoCamelCase = localStorage.getItem('autoCamelCase');
        if (storedAutoCamelCase !== null) {
            this.autoCamelCase = storedAutoCamelCase === 'true';
        }
        
        // 初始化转换器
        this.arktsConverter = new JsonToArkTSConverter();
        this.swiftConverter = new JsonToSwiftConverter();
        
        // 默认不加载示例
    },
    
    watch: {
        // 监听语言选择变化，保存到本地存储
        selectedLanguage(newVal) {
            this.setStoredLanguage(newVal);
        },
        // 监听自动驼峰设置变化，保存到本地存储
        autoCamelCase(newVal) {
            localStorage.setItem('autoCamelCase', newVal.toString());
        }
    },
    
    methods: {
        /**
         * 从本地存储获取语言选择
         */
        getStoredLanguage() {
            const stored = localStorage.getItem('selectedLanguage');
            return stored || 'arkts'; // 默认为arkts
        },
        
        /**
         * 保存语言选择到本地存储
         */
        setStoredLanguage(language) {
            localStorage.setItem('selectedLanguage', language);
        },
        /**
         * 加载示例
         */
        loadExample() {
            // 如果已有内容，弹窗确认
            if (this.jsonInput.trim()) {
                this.$confirm('当前输入区域已有内容，是否替换为示例内容？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    this.jsonInput = this.exampleJson;
                    this.$message.success('示例加载成功！');
                }).catch(() => {
                    // 用户取消，不做任何操作
                });
            } else {
                // 直接加载示例
                this.jsonInput = this.exampleJson;
                this.$message.success('示例加载成功！');
            }
        },
        
        /**
         * 清空输入
         */
        clearInput() {
            this.jsonInput = '';
            this.outputClasses = []; // 同时清空输出区域
            this.collapsedBlocks = {}; // 重置折叠状态
        },
        
        /**
         * 显示设置弹窗
         */
        showSettings() {
            this.settingsDialogVisible = true;
        },
        
        /**
         * 语言切换
         */
        onLanguageChange() {
            this.outputClasses = [];
            this.collapsedBlocks = {}; // 重置折叠状态
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
                        result = this.swiftConverter.convert(jsonStr, this.autoCamelCase);
                    }
                    
                    // 重置折叠状态
                    this.collapsedBlocks = {};
                    
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
        },
        
        /**
         * 复制所有代码
         */
        async copyAllCode() {
            try {
                const allCode = this.outputClasses.map(item => item.code).join('\n\n');
                await navigator.clipboard.writeText(allCode);
                this.$message.success('复制成功！');
            } catch (error) {
                console.error('复制失败:', error);
                this.$message.error('复制失败，请手动复制');
            }
        },
        
        /**
         * 切换代码块的折叠状态
         */
        toggleCollapse(index) {
            this.$set(this.collapsedBlocks, index, !this.collapsedBlocks[index]);
        },
        
        /**
         * 检查代码块是否折叠
         */
        isCollapsed(index) {
            return this.collapsedBlocks[index] || false;
        },
        
        /**
         * 获取折叠/展开按钮的图标
         */
        getToggleIcon(index) {
            return this.isCollapsed(index) ? 'el-icon-arrow-down' : 'el-icon-arrow-up';
        },
        
        /**
         * 获取折叠/展开按钮的提示文本
         */
        getToggleText(index) {
            return this.isCollapsed(index) ? '展开' : '收起';
        }
    }
});

/**
 * JSON 转 ArkTS Model 转换器
 */
class JsonToArkTSConverter {
    constructor() {
        this.generatedClasses = new Map(); // 存储已生成的类定义
        this.classOrder = []; // 记录类生成顺序
    }

    /**
     * 转换 JSON 到 ArkTS Model
     * @param {string} jsonStr - JSON 字符串
     * @returns {string} - ArkTS Model 代码
     */
    convert(jsonStr) {
        try {
            this.generatedClasses.clear();
            this.classOrder = [];
            
            const jsonObj = JSON.parse(jsonStr);
            
            // 检查是否为空对象
            if (Object.keys(jsonObj).length === 0) {
                throw new Error('JSON 对象为空');
            }
            
            // 直接处理整个 JSON 对象，将其作为一个根对象
            const firstKey = Object.keys(jsonObj)[0];
            
            // 如果只有一个根键且其值是对象，使用该键作为类名
            if (Object.keys(jsonObj).length === 1) {
                const value = jsonObj[firstKey];
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // 标准情况：{ "User": { "name": "...", ... } }
                    // 将根类名转换为大驼峰命名
                    const className = this.toPascalCase(firstKey);
                    this.processObject(value, className);
                } else {
                    // 非标准情况：{ "code": "200" } -> 创建一个包含该字段的类
                    this.processObject(jsonObj, this.generateDefaultClassName(jsonObj));
                }
            } else {
                // 多个根键：{ "name": "...", "age": 20 } -> 创建一个类包含所有字段
                this.processObject(jsonObj, this.generateDefaultClassName(jsonObj));
            }
            
            // 生成最终代码
            return this.generateFinalCode();
            
        } catch (error) {
            throw new Error(`JSON 解析失败: ${error.message}`);
        }
    }

    /**
     * 生成默认类名
     * @param {Object} obj - JSON 对象
     * @returns {string} - 类名
     */
    generateDefaultClassName(obj) {
        // 使用第一个 key 转换为大驼峰命名作为类名
        const firstKey = Object.keys(obj)[0];
        return this.toPascalCase(firstKey);
    }

    /**
     * 处理对象，生成类定义
     * @param {Object} obj - 要处理的对象
     * @param {string} className - 类名
     * @returns {string} - 类名
     */
    processObject(obj, className) {
        if (this.generatedClasses.has(className)) {
            return className;
        }

        const fields = [];
        const fieldNames = Object.keys(obj).sort(); // 按字母顺序排序

        fieldNames.forEach(fieldName => {
            const value = obj[fieldName];
            const fieldType = this.getFieldType(value, fieldName);
            fields.push({
                name: fieldName,
                type: fieldType.type,
                typeName: fieldType.typeName,
                isOptional: fieldType.isOptional,
                defaultValue: fieldType.defaultValue
            });
        });

        this.generatedClasses.set(className, fields);
        this.classOrder.push(className);
        
        return className;
    }

    /**
     * 获取字段类型信息
     * @param {any} value - 字段值
     * @param {string} fieldName - 字段名
     * @returns {Object} - 类型信息
     */
    getFieldType(value, fieldName) {
        if (value === null || value === undefined) {
            // null 或 undefined 作为字符串处理
            return {
                type: 'String',
                typeName: 'string',
                isOptional: false,
                defaultValue: "''"
            };
        }

        const type = typeof value;

        // 字符串类型
        if (type === 'string') {
            return {
                type: 'String',
                typeName: 'string',
                isOptional: false,
                defaultValue: "''"
            };
        }

        // 数字类型
        if (type === 'number') {
            return {
                type: 'Number',
                typeName: 'number',
                isOptional: false,
                defaultValue: '0'
            };
        }

        // 布尔类型
        if (type === 'boolean') {
            return {
                type: 'Boolean',
                typeName: 'boolean',
                isOptional: false,
                defaultValue: 'false'
            };
        }

        // 数组类型
        if (Array.isArray(value)) {
            if (value.length === 0) {
                // 空数组，默认为字符串数组
                return {
                    type: 'String',
                    typeName: 'string[]',
                    isOptional: false,
                    defaultValue: '[]'
                };
            }

            const firstElement = value[0];
            const elementType = typeof firstElement;

            if (elementType === 'string') {
                return {
                    type: 'String',
                    typeName: 'string[]',
                    isOptional: false,
                    defaultValue: '[]'
                };
            }

            if (elementType === 'number') {
                return {
                    type: 'Number',
                    typeName: 'number[]',
                    isOptional: false,
                    defaultValue: '[]'
                };
            }

            if (elementType === 'boolean') {
                return {
                    type: 'Boolean',
                    typeName: 'boolean[]',
                    isOptional: false,
                    defaultValue: '[]'
                };
            }

            if (elementType === 'object' && firstElement !== null) {
                // 对象数组，移除末尾的 s 并转换为大驼峰命名
                const fieldNameSingular = fieldName.replace(/s$/, '');
                const nestedClassName = this.toPascalCase(fieldNameSingular);
                this.processObject(firstElement, nestedClassName);
                return {
                    type: nestedClassName,
                    typeName: `${nestedClassName}[]`,
                    isOptional: false,
                    defaultValue: '[]'
                };
            }

            // 默认为字符串数组
            return {
                type: 'String',
                typeName: 'string[]',
                isOptional: false,
                defaultValue: '[]'
            };
        }

        // 对象类型（嵌套对象）
        if (type === 'object') {
            const nestedClassName = this.toPascalCase(fieldName);
            this.processObject(value, nestedClassName);
            return {
                type: nestedClassName,
                typeName: nestedClassName,
                isOptional: true, // 嵌套对象为可选
                defaultValue: 'undefined'
            };
        }

        // 默认类型
        return {
            type: 'String',
            typeName: 'string',
            isOptional: false,
            defaultValue: "''"
        };
    }

    /**
     * 转换为大驼峰命名（PascalCase）
     * @param {string} str - 原始字符串
     * @returns {string} - 大驼峰命名的字符串
     */
    toPascalCase(str) {
        if (!str) return str;
        
        // 处理下划线、连字符、空格分隔的字符串
        return str
            .split(/[_\-\s]+/) // 按下划线、连字符、空格分割
            .map(word => {
                if (!word) return '';
                // 每个单词首字母大写
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join('');
    }

    /**
     * 首字母大写（帕斯卡命名法）
     * @param {string} str - 原始字符串
     * @returns {string} - 首字母大写的字符串
     */
    capitalizeFirstLetter(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * 生成类的代码
     * @param {string} className - 类名
     * @param {Array} fields - 字段列表
     * @returns {string} - 类代码
     */
    generateClassCode(className, fields) {
        let code = `export class ${className} {\n`;

        fields.forEach((field, index) => {
            const { name, type, typeName, isOptional, defaultValue } = field;
            
            // 添加装饰器
            code += `  @Type(() => ${type})\n`;
            code += `  @Transform((params) => params.value ?? ${defaultValue})\n`;
            
            // 添加字段定义
            if (isOptional) {
                code += `  ${name}?: ${typeName};\n`;
            } else {
                code += `  ${name}: ${typeName} = ${defaultValue};\n`;
            }
            
            // 只在非最后一个字段后添加空行
            if (index < fields.length - 1) {
                code += '\n';
            }
        });

        code += '}\n';
        return code;
    }

    /**
     * 生成最终代码
     * @returns {Object} - 包含导入语句和类列表的对象
     */
    generateFinalCode() {
        const importStatement = "import { Type, Transform } from 'class-transformer';";
        
        // 按生成顺序的反序输出类（嵌套类在前，根类在后）
        const reversedOrder = [...this.classOrder].reverse();
        
        const classes = reversedOrder.map(className => {
            const fields = this.generatedClasses.get(className);
            return {
                name: className,
                code: this.generateClassCode(className, fields)
            };
        });

        return {
            importStatement,
            classes
        };
    }
}

// 导出转换器实例
window.JsonToArkTSConverter = JsonToArkTSConverter;

/**
 * JSON 转 Swift Model 转换器
 */
class JsonToSwiftConverter {
    constructor() {
        this.generatedClasses = new Map(); // 存储已生成的类定义
        this.classOrder = []; // 记录类生成顺序
    }

    /**
     * 转换 JSON 到 Swift Model
     * @param {string} jsonStr - JSON 字符串
     * @returns {string} - Swift Model 代码
     */
    convert(jsonStr) {
        try {
            this.generatedClasses.clear();
            this.classOrder = [];
            
            const jsonObj = JSON.parse(jsonStr);
            
            // 检查是否为空对象
            if (Object.keys(jsonObj).length === 0) {
                throw new Error('JSON 对象为空');
            }
            
            // 直接处理整个 JSON 对象，将其作为一个根对象
            const firstKey = Object.keys(jsonObj)[0];
            
            // 如果只有一个根键且其值是对象，使用该键作为类名
            if (Object.keys(jsonObj).length === 1) {
                const value = jsonObj[firstKey];
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // 标准情况：{ "User": { "name": "...", ... } }
                    // 将根类名转换为大驼峰命名
                    const className = this.toPascalCase(firstKey);
                    this.processObject(value, className);
                } else {
                    // 非标准情况：{ "code": "200" } -> 创建一个包含该字段的类
                    this.processObject(jsonObj, this.generateDefaultClassName(jsonObj));
                }
            } else {
                // 多个根键：{ "name": "...", "age": 20 } -> 创建一个类包含所有字段
                this.processObject(jsonObj, this.generateDefaultClassName(jsonObj));
            }
            
            // 生成最终代码
            return this.generateFinalCode();
            
        } catch (error) {
            throw new Error(`JSON 解析失败: ${error.message}`);
        }
    }

    /**
     * 生成默认类名
     * @param {Object} obj - JSON 对象
     * @returns {string} - 类名
     */
    generateDefaultClassName(obj) {
        // 使用第一个 key 转换为大驼峰命名作为类名
        const firstKey = Object.keys(obj)[0];
        return this.toPascalCase(firstKey);
    }

    /**
     * 处理对象，生成类定义
     * @param {Object} obj - 要处理的对象
     * @param {string} className - 类名
     * @returns {string} - 类名
     */
    processObject(obj, className) {
        if (this.generatedClasses.has(className)) {
            return className;
        }

        const fields = [];
        const fieldNames = Object.keys(obj).sort(); // 按字母顺序排序

        fieldNames.forEach(fieldName => {
            const value = obj[fieldName];
            const fieldType = this.getFieldType(value, fieldName);
            fields.push({
                name: fieldName,
                type: fieldType.type,
                isOptional: fieldType.isOptional
            });
        });

        this.generatedClasses.set(className, fields);
        this.classOrder.push(className);
        
        return className;
    }

    /**
     * 获取字段类型信息
     * @param {any} value - 字段值
     * @param {string} fieldName - 字段名
     * @returns {Object} - 类型信息
     */
    getFieldType(value, fieldName) {
        if (value === null || value === undefined) {
            // null 或 undefined 作为可选字符串处理
            return {
                type: 'String?',
                isOptional: true
            };
        }

        const type = typeof value;

        // 字符串类型
        if (type === 'string') {
            return {
                type: 'String',
                isOptional: false
            };
        }

        // 数字类型（Swift 区分 Int 和 Double）
        if (type === 'number') {
            const isInteger = Number.isInteger(value);
            return {
                type: isInteger ? 'Int' : 'Double',
                isOptional: false
            };
        }

        // 布尔类型
        if (type === 'boolean') {
            return {
                type: 'Bool',
                isOptional: false
            };
        }

        // 数组类型
        if (Array.isArray(value)) {
            if (value.length === 0) {
                // 空数组，默认为字符串数组
                return {
                    type: '[String]',
                    isOptional: false
                };
            }

            const firstElement = value[0];
            const elementType = typeof firstElement;

            if (elementType === 'string') {
                return {
                    type: '[String]',
                    isOptional: false
                };
            }

            if (elementType === 'number') {
                const isInteger = Number.isInteger(firstElement);
                return {
                    type: isInteger ? '[Int]' : '[Double]',
                    isOptional: false
                };
            }

            if (elementType === 'boolean') {
                return {
                    type: '[Bool]',
                    isOptional: false
                };
            }

            if (elementType === 'object' && firstElement !== null) {
                // 对象数组，移除末尾的 s 并转换为大驼峰命名
                const fieldNameSingular = fieldName.replace(/s$/, '');
                const nestedClassName = this.toPascalCase(fieldNameSingular);
                this.processObject(firstElement, nestedClassName);
                return {
                    type: `[${nestedClassName}]`,
                    isOptional: false
                };
            }

            // 默认为字符串数组
            return {
                type: '[String]',
                isOptional: false
            };
        }

        // 对象类型（嵌套对象）
        if (type === 'object') {
            const nestedClassName = this.toPascalCase(fieldName);
            this.processObject(value, nestedClassName);
            return {
                type: nestedClassName + '?',
                isOptional: true
            };
        }

        // 默认类型
        return {
            type: 'String',
            isOptional: false
        };
    }

    /**
     * 转换为大驼峰命名（PascalCase）
     * @param {string} str - 原始字符串
     * @returns {string} - 大驼峰命名的字符串
     */
    toPascalCase(str) {
        if (!str) return str;
        
        // 处理下划线、连字符、空格分隔的字符串
        return str
            .split(/[_\-\s]+/) // 按下划线、连字符、空格分割
            .map(word => {
                if (!word) return '';
                // 每个单词首字母大写
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join('');
    }

    /**
     * 转换为小驼峰命名（camelCase）
     * @param {string} str - 原始字符串
     * @returns {string} - 小驼峰命名的字符串
     */
    toCamelCase(str) {
        if (!str) return str;
        
        // 处理下划线、连字符、空格分隔的字符串
        const parts = str.split(/[_\-\s]+/);
        return parts
            .map((word, index) => {
                if (!word) return '';
                if (index === 0) {
                    // 首个单词全小写
                    return word.toLowerCase();
                }
                // 其他单词首字母大写
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join('');
    }

    /**
     * 生成类的代码
     * @param {string} className - 类名
     * @param {Array} fields - 字段列表
     * @returns {string} - 类代码
     */
    generateClassCode(className, fields) {
        let code = `struct ${className}: Codable {\n`;

        fields.forEach((field, index) => {
            const { name, type } = field;
            const camelCaseName = this.toCamelCase(name);
            
            // 添加字段定义
            code += `    let ${camelCaseName}: ${type}\n`;
            
            // 如果字段名不同，添加 CodingKeys
            if (!field.needsCodingKeys) {
                field.needsCodingKeys = (camelCaseName !== name);
            }
        });

        // 检查是否需要 CodingKeys
        const needsCodingKeys = fields.some(f => f.needsCodingKeys);
        if (needsCodingKeys) {
            code += `\n    enum CodingKeys: String, CodingKey {\n`;
            fields.forEach(field => {
                const camelCaseName = this.toCamelCase(field.name);
                code += `        case ${camelCaseName} = "${field.name}"\n`;
            });
            code += `    }\n`;
        }

        code += `}\n`;
        return code;
    }

    /**
     * 生成最终代码
     * @returns {Object} - 包含导入语句和类列表的对象
     */
    generateFinalCode() {
        const importStatement = "import Foundation";
        
        // 按生成顺序的反序输出类（嵌套类在前，根类在后）
        const reversedOrder = [...this.classOrder].reverse();
        
        const classes = reversedOrder.map(className => {
            const fields = this.generatedClasses.get(className);
            return {
                name: className,
                code: this.generateClassCode(className, fields)
            };
        });

        return {
            importStatement,
            classes
        };
    }
}

// 导出转换器实例
window.JsonToSwiftConverter = JsonToSwiftConverter;

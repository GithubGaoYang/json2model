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
            
            // 如果只有一个根键且其值是对象，使用固定类名Root
            if (Object.keys(jsonObj).length === 1) {
                const value = jsonObj[firstKey];
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // 标准情况：{ "User": { "name": "...", ... } }
                    // 固定根类名为Root
                    const className = 'Root';
                    this.processObject(value, className);
                } else {
                    // 非标准情况：{ "code": "200" } -> 创建一个包含该字段的类
                    this.processObject(jsonObj, this.generateDefaultClassName(jsonObj));
                }
            } else {
                // 多个根键：{ "name": "...", "age": 20 } -> 创建一个类包含所有字段
                // 固定根类名为Root
                this.processObject(jsonObj, 'Root');
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
            
            // 如果只有一个根键且其值是对象，使用固定类名Root
            if (Object.keys(jsonObj).length === 1) {
                const value = jsonObj[firstKey];
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // 标准情况：{ "User": { "name": "...", ... } }
                    // 固定根类名为Root
                    const className = 'Root';
                    this.processObject(value, className);
                } else {
                    // 非标准情况：{ "code": "200" } -> 创建一个包含该字段的类
                    this.processObject(jsonObj, this.generateDefaultClassName(jsonObj));
                }
            } else {
                // 多个根键：{ "name": "...", "age": 20 } -> 创建一个类包含所有字段
                // 固定根类名为Root
                this.processObject(jsonObj, 'Root');
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
                defaultValue: fieldType.defaultValue,
                jsonMethod: fieldType.jsonMethod,
                isArray: fieldType.isArray,
                isObjectArray: fieldType.isObjectArray,
                isNestedObject: fieldType.isNestedObject,
                elementType: fieldType.elementType,
                elementJsonMethod: fieldType.elementJsonMethod,
                nestedClassName: fieldType.nestedClassName
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
                type: 'String',
                defaultValue: '""',
                jsonMethod: 'stringValue'
            };
        }

        const type = typeof value;

        // 字符串类型
        if (type === 'string') {
            return {
                type: 'String',
                defaultValue: '""',
                jsonMethod: 'stringValue'
            };
        }

        // 数字类型（Swift 区分 Int 和 Double）
        if (type === 'number') {
            const isInteger = Number.isInteger(value);
            return {
                type: isInteger ? 'Int' : 'Double',
                defaultValue: isInteger ? '0' : '0.0',
                jsonMethod: isInteger ? 'intValue' : 'doubleValue'
            };
        }

        // 布尔类型
        if (type === 'boolean') {
            return {
                type: 'Bool',
                defaultValue: 'false',
                jsonMethod: 'boolValue'
            };
        }

        // 数组类型
        if (Array.isArray(value)) {
            if (value.length === 0) {
                // 空数组，默认为字符串数组
                return {
                    type: '[String]',
                    defaultValue: '[String]()',
                    jsonMethod: 'arrayValue',
                    isArray: true,
                    elementType: 'String',
                    elementJsonMethod: 'stringValue'
                };
            }

            const firstElement = value[0];
            const elementType = typeof firstElement;

            if (elementType === 'string') {
                return {
                    type: '[String]',
                    defaultValue: '[String]()',
                    jsonMethod: 'arrayValue',
                    isArray: true,
                    elementType: 'String',
                    elementJsonMethod: 'stringValue'
                };
            }

            if (elementType === 'number') {
                const isInteger = Number.isInteger(firstElement);
                const arrayType = isInteger ? 'Int' : 'Double';
                return {
                    type: `[${arrayType}]`,
                    defaultValue: `[${arrayType}]()`,
                    jsonMethod: 'arrayValue',
                    isArray: true,
                    elementType: arrayType,
                    elementJsonMethod: isInteger ? 'intValue' : 'doubleValue'
                };
            }

            if (elementType === 'boolean') {
                return {
                    type: '[Bool]',
                    defaultValue: '[Bool]()',
                    jsonMethod: 'arrayValue',
                    isArray: true,
                    elementType: 'Bool',
                    elementJsonMethod: 'boolValue'
                };
            }

            if (elementType === 'object' && firstElement !== null) {
                // 对象数组，移除末尾的 s 并转换为大驼峰命名
                const fieldNameSingular = fieldName.replace(/s$/, '');
                const nestedClassName = this.toPascalCase(fieldNameSingular);
                this.processObject(firstElement, nestedClassName);
                return {
                    type: `[${nestedClassName}]`,
                    defaultValue: `[${nestedClassName}]()`,
                    jsonMethod: 'arrayValue',
                    isArray: true,
                    isObjectArray: true,
                    elementType: nestedClassName
                };
            }

            // 默认为字符串数组
            return {
                type: '[String]',
                defaultValue: '[String]()',
                jsonMethod: 'arrayValue',
                isArray: true,
                elementType: 'String',
                elementJsonMethod: 'stringValue'
            };
        }

        // 对象类型（嵌套对象）
        if (type === 'object') {
            const nestedClassName = this.toPascalCase(fieldName);
            this.processObject(value, nestedClassName);
            return {
                type: nestedClassName + '?',
                defaultValue: null,  // 嵌套对象不使用 = nil，而是用类型声明
                jsonMethod: 'dictionaryValue',
                isNestedObject: true,
                nestedClassName: nestedClassName
            };
        }

        // 默认类型
        return {
            type: 'String',
            defaultValue: '""',
            jsonMethod: 'stringValue'
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
     * 生成数组初始化代码
     * @param {Object} field - 字段信息
     * @param {string} fieldName - 字段名
     * @returns {string} - 初始化代码
     */
    generateArrayInit(field, fieldName) {
        if (field.isObjectArray) {
            // 对象数组
            return `${fieldName} = json["${field.name}"].arrayValue.compactMap { ${field.elementType}(json: $0) }`;
        } else {
            // 基础类型数组
            return `${fieldName} = json["${field.name}"].arrayValue.map { $0.${field.elementJsonMethod} }`;
        }
    }

    /**
     * 生成类的代码
     * @param {string} className - 类名
     * @param {Array} fields - 字段列表
     * @returns {string} - 类代码
     */
    generateClassCode(className, fields) {
        let code = `struct ${className} {\n`;

        // 生成属性定义
        fields.forEach(field => {
            const camelCaseName = this.toCamelCase(field.name);
            // 嵌套对象使用类型声明，其他使用默认值赋值
            if (field.defaultValue === null) {
                code += `    var ${camelCaseName}: ${field.type}\n`;
            } else {
                code += `    var ${camelCaseName} = ${field.defaultValue}\n`;
            }
        });

        code += `    \n`;
        code += `    init() {}\n`;
        code += `    \n`;
        
        // 生成 SwiftyJSON 初始化方法
        code += `    init?(json: JSON) {\n`;
        code += `        guard json.type == .dictionary else {\n`;
        code += `            return nil\n`;
        code += `        }\n`;
        code += `        \n`;

        fields.forEach(field => {
            const camelCaseName = this.toCamelCase(field.name);
            
            if (field.isNestedObject) {
                // 嵌套对象 - 直接赋值，不使用 if let
                code += `        ${camelCaseName} = ${field.nestedClassName}(json: json["${field.name}"])\n`;
            } else if (field.isArray) {
                // 数组类型
                code += `        ${this.generateArrayInit(field, camelCaseName)}\n`;
            } else {
                // 基础类型
                code += `        ${camelCaseName} = json["${field.name}"].${field.jsonMethod}\n`;
            }
        });

        code += `    }\n`;
        code += `}\n`;
        return code;
    }

    /**
     * 生成最终代码
     * @returns {Object} - 包含导入语句和类列表的对象
     */
    generateFinalCode() {
        const importStatement = "import SwiftyJSON";
        
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

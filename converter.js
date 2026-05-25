/**
 * JSON 转换器基类
 * 提供通用的 JSON 解析和类生成逻辑
 */
class JsonConverterBase {
    constructor() {
        this.generatedClasses = new Map();
        this.classOrder = [];
    }

    /**
     * 转换 JSON 到 Model
     * @param {string} jsonStr - JSON 字符串
     * @returns {Object} - 包含导入语句和类列表的对象
     */
    convert(jsonStr) {
        try {
            this.generatedClasses.clear();
            this.classOrder = [];

            const jsonObj = JSON.parse(jsonStr);
            this._processRootValue(jsonObj);

            return this._generateOutput();
        } catch (error) {
            throw new Error(`JSON 解析失败: ${error.message}`);
        }
    }

    /**
     * 处理根值（对象或数组）
     * @private
     */
    _processRootValue(jsonObj) {
        if (Array.isArray(jsonObj)) {
            this._processRootArray(jsonObj);
        } else if (typeof jsonObj === 'object' && jsonObj !== null) {
            this._processRootObject(jsonObj);
        } else {
            throw new Error('JSON 必须是对象或数组');
        }
    }

    /**
     * 处理根数组
     * @private
     */
    _processRootArray(array) {
        if (array.length === 0) {
            throw new Error('JSON 数组为空');
        }
        if (array.some(item => typeof item !== 'object' || item === null || Array.isArray(item))) {
            throw new Error('JSON 数组元素必须是对象');
        }
        this.processObjectArray(array, 'RootItem');
    }

    /**
     * 处理根对象
     * @private
     */
    _processRootObject(obj) {
        if (Object.keys(obj).length === 0) {
            throw new Error('JSON 对象为空');
        }

        // 直接使用根对象处理，保留嵌套结构
        this.processObject(obj, 'Root');
    }

    /**
     * 检查值是否为纯对象（非数组）
     * @private
     */
    _isPlainObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    /**
     * 处理对象，生成类定义
     */
    processObject(obj, className) {
        if (this.generatedClasses.has(className)) {
            return className;
        }

        const fields = this._extractFields(obj);
        this.generatedClasses.set(className, fields);
        this.classOrder.push(className);

        return className;
    }

    /**
     * 处理对象数组，合并所有对象的字段后生成类定义
     */
    processObjectArray(array, className) {
        if (this.generatedClasses.has(className)) {
            return className;
        }

        const mergedObj = this._mergeArrayFields(array);
        const fields = this._extractFields(mergedObj);
        this.generatedClasses.set(className, fields);
        this.classOrder.push(className);

        return className;
    }

    /**
     * 从对象中提取字段信息
     * @private
     */
    _extractFields(obj) {
        return Object.keys(obj).sort().map(fieldName => {
            const value = obj[fieldName];
            const fieldInfo = this._getFieldInfo(value, fieldName);
            return { name: fieldName, ...fieldInfo };
        });
    }

    /**
     * 合并数组中所有对象的字段
     * @private
     */
    _mergeArrayFields(array) {
        const merged = {};
        array.forEach(obj => {
            if (this._isPlainObject(obj)) {
                Object.keys(obj).forEach(key => {
                    const value = obj[key];
                    // 如果字段不存在，直接添加
                    if (!merged.hasOwnProperty(key)) {
                        merged[key] = value;
                    } else {
                        // 如果已存在，优先使用非空数组
                        const existingValue = merged[key];
                        if (Array.isArray(existingValue) && Array.isArray(value)) {
                            // 如果现有值是空数组，而新值是非空数组，则更新
                            if (existingValue.length === 0 && value.length > 0) {
                                merged[key] = value;
                            }
                            // 如果都是非空数组，尝试合并元素类型（后续类型推断会处理）
                        }
                        // 对于非数组类型，保留第一个遇到的值
                    }
                });
            }
        });
        return merged;
    }

    /**
     * 获取字段类型信息（子类实现）
     * @abstract
     */
    _getFieldInfo(value, fieldName) {
        throw new Error('_getFieldInfo 必须由子类实现');
    }

    /**
     * 生成输出（子类实现）
     * @abstract
     */
    _generateOutput() {
        throw new Error('_generateOutput 必须由子类实现');
    }

    /**
     * 转换为大驼峰命名（PascalCase）
     */
    toPascalCase(str) {
        if (!str) return str;
        return str
            .split(/[_\-\s]+/)
            .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
            .join('');
    }

    /**
     * 转换为小驼峰命名（camelCase）
     */
    toCamelCase(str) {
        if (!str) return str;
        return str
            .split(/[_\-\s]+/)
            .map((word, index) => {
                if (!word) return '';
                return index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join('');
    }
}

/**
 * JSON 转 ArkTS Model 转换器
 */
class JsonToArkTSConverter extends JsonConverterBase {
    /**
     * 获取 ArkTS 字段类型信息
     */
    _getFieldInfo(value, fieldName) {
        const typeHandlers = [
            { check: v => v === null || v === undefined, get: () => ({ type: 'String', typeName: 'string', isOptional: false, defaultValue: "''" }) },
            { check: v => typeof v === 'string', get: () => ({ type: 'String', typeName: 'string', isOptional: false, defaultValue: "''" }) },
            { check: v => typeof v === 'number', get: () => ({ type: 'Number', typeName: 'number', isOptional: false, defaultValue: '0' }) },
            { check: v => typeof v === 'boolean', get: () => ({ type: 'Boolean', typeName: 'boolean', isOptional: false, defaultValue: 'false' }) },
            { check: v => Array.isArray(v), get: v => this._getArrayTypeInfo(v, fieldName) },
            { check: v => typeof v === 'object', get: v => this._getObjectTypeInfo(v, fieldName) }
        ];

        const handler = typeHandlers.find(h => h.check(value));
        return handler ? handler.get(value) : { type: 'String', typeName: 'string', isOptional: false, defaultValue: "''" };
    }

    /**
     * 获取数组类型信息
     * @private
     */
    _getArrayTypeInfo(array, fieldName) {
        if (array.length === 0) {
            return { type: 'String', typeName: 'string[]', isOptional: false, defaultValue: '[]' };
        }

        const firstElement = array[0];

        // 嵌套数组
        if (Array.isArray(firstElement)) {
            return this._getNestedArrayTypeInfo(firstElement, fieldName);
        }

        // 一维数组
        return this._getSimpleArrayTypeInfo(array, firstElement, fieldName);
    }

    /**
     * 获取嵌套数组类型信息
     * @private
     */
    _getNestedArrayTypeInfo(nestedArray, fieldName) {
        if (nestedArray.length === 0) {
            return { type: 'String', typeName: 'string[][]', isOptional: false, defaultValue: '[]' };
        }

        const firstElement = nestedArray[0];
        const elementType = typeof firstElement;

        const typeMap = {
            string: { type: 'String', typeName: 'string[][]' },
            number: { type: 'Number', typeName: 'number[][]' },
            boolean: { type: 'Boolean', typeName: 'boolean[][]' }
        };

        if (typeMap[elementType]) {
            return { ...typeMap[elementType], isOptional: false, defaultValue: '[]' };
        }

        if (elementType === 'object' && firstElement !== null) {
            const className = this._processObjectArrayAndGetClassName(nestedArray, fieldName);
            return { type: className, typeName: `${className}[][]`, isOptional: false, defaultValue: '[]' };
        }

        return { type: 'String', typeName: 'string[][]', isOptional: false, defaultValue: '[]' };
    }

    /**
     * 获取简单数组类型信息
     * @private
     */
    _getSimpleArrayTypeInfo(array, firstElement, fieldName) {
        const elementType = typeof firstElement;

        const typeMap = {
            string: { type: 'String', typeName: 'string[]' },
            number: { type: 'Number', typeName: 'number[]' },
            boolean: { type: 'Boolean', typeName: 'boolean[]' }
        };

        if (typeMap[elementType]) {
            return { ...typeMap[elementType], isOptional: false, defaultValue: '[]' };
        }

        if (elementType === 'object' && firstElement !== null) {
            const className = this._processObjectArrayAndGetClassName(array, fieldName);
            return { type: className, typeName: `${className}[]`, isOptional: false, defaultValue: '[]' };
        }

        return { type: 'String', typeName: 'string[]', isOptional: false, defaultValue: '[]' };
    }

    /**
     * 处理对象数组并返回类名
     * @private
     */
    _processObjectArrayAndGetClassName(array, fieldName) {
        const nestedClassName = this.toPascalCase(fieldName);
        const arrayClassName = `${nestedClassName}Item`;
        this.processObjectArray(array, arrayClassName);
        return arrayClassName;
    }

    /**
     * 获取对象类型信息
     * @private
     */
    _getObjectTypeInfo(obj, fieldName) {
        const nestedClassName = this.toPascalCase(fieldName);
        this.processObject(obj, nestedClassName);
        return { type: nestedClassName, typeName: nestedClassName, isOptional: true, defaultValue: 'undefined' };
    }

    /**
     * 生成 ArkTS 输出
     */
    _generateOutput() {
        const importStatement = "import { Type, Transform } from 'class-transformer';";
        const classes = this._generateClasses();
        return { importStatement, classes };
    }

    /**
     * 生成类代码列表
     * @private
     */
    _generateClasses() {
        return [...this.classOrder].reverse().map(className => ({
            name: className,
            code: this._generateClassCode(className, this.generatedClasses.get(className))
        }));
    }

    /**
     * 生成单个类的代码
     * @private
     */
    _generateClassCode(className, fields) {
        const fieldCodes = fields.map((field, index) => {
            const fieldCode = this._generateFieldCode(field);
            return index < fields.length - 1 ? fieldCode + '\n' : fieldCode;
        });

        return `export class ${className} {\n${fieldCodes.join('')}\n}\n`;
    }

    /**
     * 生成字段代码
     * @private
     */
    _generateFieldCode(field) {
        const { name, type, typeName, isOptional, defaultValue } = field;
        const declaration = isOptional ? `  ${name}?: ${typeName};` : `  ${name}: ${typeName} = ${defaultValue};`;
        return `  @Type(() => ${type})\n  @Transform((params) => params.value ?? ${defaultValue})\n${declaration}`;
    }
}

/**
 * JSON 转 Swift Model 转换器
 */
class JsonToSwiftConverter extends JsonConverterBase {
    /**
     * 获取 Swift 字段类型信息
     */
    _getFieldInfo(value, fieldName) {
        const typeHandlers = [
            { check: v => v === null || v === undefined, get: () => ({ type: 'String', defaultValue: '""', jsonMethod: 'stringValue' }) },
            { check: v => typeof v === 'string', get: () => ({ type: 'String', defaultValue: '""', jsonMethod: 'stringValue' }) },
            { check: v => typeof v === 'number', get: v => this._getNumberTypeInfo(v) },
            { check: v => typeof v === 'boolean', get: () => ({ type: 'Bool', defaultValue: 'false', jsonMethod: 'boolValue' }) },
            { check: v => Array.isArray(v), get: v => this._getArrayTypeInfo(v, fieldName) },
            { check: v => typeof v === 'object', get: v => this._getObjectTypeInfo(v, fieldName) }
        ];

        const handler = typeHandlers.find(h => h.check(value));
        return handler ? handler.get(value) : { type: 'String', defaultValue: '""', jsonMethod: 'stringValue' };
    }

    /**
     * 获取数字类型信息
     * @private
     */
    _getNumberTypeInfo(value) {
        const isInteger = Number.isInteger(value);
        return {
            type: isInteger ? 'Int' : 'Double',
            defaultValue: isInteger ? '0' : '0.0',
            jsonMethod: isInteger ? 'intValue' : 'doubleValue'
        };
    }

    /**
     * 获取数组类型信息
     * @private
     */
    _getArrayTypeInfo(array, fieldName) {
        if (array.length === 0) {
            return { type: '[String]', defaultValue: '[String]()', jsonMethod: 'arrayValue', isArray: true, elementType: 'String', elementJsonMethod: 'stringValue' };
        }

        const firstElement = array[0];

        if (Array.isArray(firstElement)) {
            return this._getNestedArrayTypeInfo(firstElement, fieldName);
        }

        return this._getSimpleArrayTypeInfo(array, firstElement, fieldName);
    }

    /**
     * 获取嵌套数组类型信息
     * @private
     */
    _getNestedArrayTypeInfo(nestedArray, fieldName) {
        if (nestedArray.length === 0) {
            return { type: '[[String]]', defaultValue: '[[String]]()', jsonMethod: 'arrayValue', isArray: true, elementType: '[String]', elementJsonMethod: 'arrayValue' };
        }

        const firstElement = nestedArray[0];
        const elementType = typeof firstElement;

        if (elementType === 'string') {
            return { type: '[[String]]', defaultValue: '[[String]]()', jsonMethod: 'arrayValue', isArray: true, elementType: '[String]', elementJsonMethod: 'arrayValue' };
        }

        if (elementType === 'number') {
            const isInteger = Number.isInteger(firstElement);
            const type = isInteger ? 'Int' : 'Double';
            return { type: `[[${type}]]`, defaultValue: `[[${type}]]()`, jsonMethod: 'arrayValue', isArray: true, elementType: `[${type}]`, elementJsonMethod: 'arrayValue' };
        }

        if (elementType === 'boolean') {
            return { type: '[[Bool]]', defaultValue: '[[Bool]]()', jsonMethod: 'arrayValue', isArray: true, elementType: '[Bool]', elementJsonMethod: 'arrayValue' };
        }

        if (elementType === 'object' && firstElement !== null) {
            const className = this._processObjectArrayAndGetClassName(nestedArray, fieldName);
            return { type: `[[${className}]]`, defaultValue: `[[${className}]]()`, jsonMethod: 'arrayValue', isArray: true, isObjectArray: true, isNestedArray: true, elementType: className, elementJsonMethod: 'dictionaryValue' };
        }

        return { type: '[[String]]', defaultValue: '[[String]]()', jsonMethod: 'arrayValue', isArray: true, elementType: '[String]', elementJsonMethod: 'arrayValue' };
    }

    /**
     * 获取简单数组类型信息
     * @private
     */
    _getSimpleArrayTypeInfo(array, firstElement, fieldName) {
        const elementType = typeof firstElement;

        if (elementType === 'string') {
            return { type: '[String]', defaultValue: '[String]()', jsonMethod: 'arrayValue', isArray: true, elementType: 'String', elementJsonMethod: 'stringValue' };
        }

        if (elementType === 'number') {
            const isInteger = Number.isInteger(firstElement);
            const type = isInteger ? 'Int' : 'Double';
            return { type: `[${type}]`, defaultValue: `[${type}]()`, jsonMethod: 'arrayValue', isArray: true, elementType: type, elementJsonMethod: isInteger ? 'intValue' : 'doubleValue' };
        }

        if (elementType === 'boolean') {
            return { type: '[Bool]', defaultValue: '[Bool]()', jsonMethod: 'arrayValue', isArray: true, elementType: 'Bool', elementJsonMethod: 'boolValue' };
        }

        if (elementType === 'object' && firstElement !== null) {
            const className = this._processObjectArrayAndGetClassName(array, fieldName);
            return { type: `[${className}]`, defaultValue: `[${className}]()`, jsonMethod: 'arrayValue', isArray: true, isObjectArray: true, elementType: className };
        }

        return { type: '[String]', defaultValue: '[String]()', jsonMethod: 'arrayValue', isArray: true, elementType: 'String', elementJsonMethod: 'stringValue' };
    }

    /**
     * 处理对象数组并返回类名
     * @private
     */
    _processObjectArrayAndGetClassName(array, fieldName) {
        const nestedClassName = this.toPascalCase(fieldName);
        const arrayClassName = `${nestedClassName}Item`;
        this.processObjectArray(array, arrayClassName);
        return arrayClassName;
    }

    /**
     * 获取对象类型信息
     * @private
     */
    _getObjectTypeInfo(obj, fieldName) {
        const nestedClassName = this.toPascalCase(fieldName);
        this.processObject(obj, nestedClassName);
        return { type: nestedClassName + '?', defaultValue: null, jsonMethod: 'dictionaryValue', isNestedObject: true, nestedClassName };
    }

    /**
     * 生成 Swift 输出
     */
    _generateOutput() {
        const importStatement = "import SwiftyJSON";
        const classes = this._generateClasses();
        return { importStatement, classes };
    }

    /**
     * 生成类代码列表
     * @private
     */
    _generateClasses() {
        return [...this.classOrder].reverse().map(className => ({
            name: className,
            code: this._generateClassCode(className, this.generatedClasses.get(className))
        }));
    }

    /**
     * 生成单个类的代码
     * @private
     */
    _generateClassCode(className, fields) {
        const propertyLines = fields.map(f => this._generatePropertyLine(f));
        const initLines = fields.map(f => this._generateInitLine(f));

        return `struct ${className} {\n${propertyLines.join('')}\n    init() {}\n    \n    init?(json: JSON) {\n        guard json.type == .dictionary else { return nil }\n        \n${initLines.join('')}\n    }\n}\n`;
    }

    /**
     * 生成属性行
     * @private
     */
    _generatePropertyLine(field) {
        const camelCaseName = this.toCamelCase(field.name);
        return field.defaultValue === null
            ? `    var ${camelCaseName}: ${field.type}\n`
            : `    var ${camelCaseName} = ${field.defaultValue}\n`;
    }

    /**
     * 生成初始化行
     * @private
     */
    _generateInitLine(field) {
        const camelCaseName = this.toCamelCase(field.name);

        if (field.isNestedObject) {
            return `        ${camelCaseName} = ${field.nestedClassName}(json: json["${field.name}"])\n`;
        }

        if (field.isArray) {
            return `        ${this._generateArrayInit(field, camelCaseName)}\n`;
        }

        return `        ${camelCaseName} = json["${field.name}"].${field.jsonMethod}\n`;
    }

    /**
     * 生成数组初始化代码
     * @private
     */
    _generateArrayInit(field, fieldName) {
        if (field.isNestedArray && field.isObjectArray) {
            return `${fieldName} = json["${field.name}"].arrayValue.map { $0.arrayValue.compactMap { ${field.elementType}(json: $0) } }`;
        }
        if (field.isObjectArray) {
            return `${fieldName} = json["${field.name}"].arrayValue.compactMap { ${field.elementType}(json: $0) }`;
        }
        return `${fieldName} = json["${field.name}"].arrayValue.map { $0.${field.elementJsonMethod} }`;
    }
}

// 导出转换器
window.JsonToArkTSConverter = JsonToArkTSConverter;
window.JsonToSwiftConverter = JsonToSwiftConverter;

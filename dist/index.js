'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('../node_modules/core-js/es7/array.js');
var fse = require('fs-extra');
var micromatch = require('micromatch');
var path = require('path');
var fs = require('fs');
var Mustache = require('mustache');
var axios = require('axios');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () {
                        return e[k];
                    }
                });
            }
        });
    }
    n['default'] = e;
    return Object.freeze(n);
}

var fse__default = /*#__PURE__*/_interopDefaultLegacy(fse);
var micromatch__default = /*#__PURE__*/_interopDefaultLegacy(micromatch);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var path__namespace = /*#__PURE__*/_interopNamespace(path);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var Mustache__default = /*#__PURE__*/_interopDefaultLegacy(Mustache);
var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const defaultConfigPath = 'apicodegen.config.js';
const pkgName = require('../package.json').name;
const defaultConfig = {
    path: 'src/app/api',
    servicePath: '/services',
    entityPath: '/entities',
    requestPath: '/request',
    projects: [],
    apiType: 'swagger',
    serviceTemplatePath: `node_modules/${pkgName}/template/service.template.ts`,
    entityTemplatePath: `node_modules/${pkgName}/template/entity.template.ts`,
    requestTemplatePath: `node_modules/${pkgName}/template/request.template.ts`,
    // assetsPath: 'node_modules/api-service-generator/template/assets',
    lang: 'ts',
    isService: true,
    isEntity: true,
    isRequest: true,
};
function loadConfig(configPath = defaultConfigPath) {
    const absolutePath = path__default['default'].join(process.cwd(), configPath);
    try {
        const userConfig = require(absolutePath);
        return Object.assign(Object.assign({}, defaultConfig), userConfig);
    }
    catch (e) {
        throw new Error(`????????????????????????:${absolutePath}\n' ${e}`);
    }
}

function rmdirsSync(rmPath) {
    if (fs__default['default'].existsSync(rmPath)) {
        const files = fs__default['default'].readdirSync(rmPath);
        files.forEach((file) => {
            const curPath = path__default['default'].join(rmPath, file);
            if (fs__default['default'].statSync(curPath).isDirectory()) {
                rmdirsSync(curPath); // ?????????????????????
            }
            else {
                fs__default['default'].unlinkSync(curPath); // ????????????
            }
        });
        fs__default['default'].rmdirSync(rmPath);
    }
}
function mkdirsSync(dirPath) {
    if (fs__default['default'].existsSync(dirPath)) {
        return true;
    }
    else {
        if (mkdirsSync(path__default['default'].dirname(dirPath))) {
            fs__default['default'].mkdirSync(dirPath);
            return true;
        }
    }
}

class FileGenerator {
    generate(data) {
        const templateModel = this.getTemplateModel(data);
        const content = Mustache__default['default'].render(require(path__namespace.join(process.cwd(), data.templatePath)), templateModel);
        this.writeFile(data.targetPath, templateModel.filename, content);
    }
    writeFile(targetPath, filename, content) {
        mkdirsSync(targetPath);
        fs__default['default'].writeFileSync(path__namespace.join(targetPath, filename), content);
    }
}

class ClassGenerator extends FileGenerator {
}

class EntityGenerator extends ClassGenerator {
    generate(data) {
        super.generate(data);
    }
    /**
     * ??????????????????????????????
     * @param type
     * @return
     */
    getTypeString(type) {
        if (type.type === 'object' && type.properties) {
            return type.properties.reduce((x, y) => {
                return x + `${y.name}: ${this.getTypeString(y)}, `;
            }, '{') + '}';
        }
        else if (type.type === 'Array') {
            if (type.items) {
                return `Array<${this.getTypeString(type.items)}>`;
            }
            else {
                return 'Array<any>';
            }
        }
        return type.type;
    }
    getDependencies(data) {
        return this.definitionToDependencies(data.properties);
    }
    /**
     * ??????????????????
     * @param properties
     * @return
     */
    definitionToDependencies(properties = []) {
        const dependencies = properties.flatMap((value) => this.getDependence(value));
        return [...new Set(dependencies)];
    }
    /**
     * ??????????????????
     * @param type
     * @return {string[]}
     */
    getDependence(type) {
        if (type.type === 'Array') {
            return this.getDependence(type.items);
        }
        else if (type.type === 'object' && type.properties) {
            return this.definitionToDependencies(type.properties);
        }
        else if (type.ref) {
            return [type.ref];
        }
        return [];
    }
    getTemplateModel(data) {
        return {
            name: data.name,
            description: data.description,
            filename: `${data.name}${data.extension}`,
            properties: data.properties && data.properties.map((value) => {
                return Object.assign(Object.assign({}, value), { typeStr: this.getTypeString(value) });
            }),
            dependencies: this.getDependencies(data).filter((value) => value !== data.name)
        };
    }
}

/**
 * ?????????/?????????/????????? ??? ???????????????(UpperCamelCase)
 */
function getUpperCamelCase(str) {
    const reg = /(^|-|_)(\w)/g;
    return str.replace(reg, ($, $1, $2) => $2.toUpperCase());
}
/**
 * ?????????/?????????/????????? ??? ???????????????(lowerCamelCase)
 */
function getLowerCamelCase(str) {
    const reg = /(^|-|_)(\w)/g;
    const reg2 = /^(\w)/g;
    return str.replace(reg, ($, $1, $2) => $2.toUpperCase())
        .replace(reg2, ($, $1) => $1.toLowerCase());
}
/**
 * ??????/????????? ??? ???????????????(kebab-case)
 */
function getKebabCase(str) {
    const reg = /^([A-Z$]+)/g;
    const reg2 = /_([a-zA-Z$]+)/g;
    const reg3 = /([A-Z$]+)/g;
    return str.replace(reg, ($, $1) => $1.toLowerCase())
        .replace(reg2, ($, $1) => '-' + $1.toLowerCase())
        .replace(reg3, ($, $1) => '-' + $1.toLowerCase());
}

function getTypeString(type) {
    if (!type) {
        return 'any';
    }
    if (type.type === 'object' && type.properties) {
        return type.properties.reduce((x, y) => {
            return x + `${y.name}: ${getTypeString(y)}, `;
        }, '{') + '}';
    }
    else if (type.type === 'Array') {
        if (type.items) {
            return `Array<${getTypeString(type.items)}>`;
        }
        else {
            return 'Array<any>';
        }
    }
    return type.type;
}

class HttpServiceGenerator extends ClassGenerator {
    generate(data) {
        super.generate(data);
    }
    /**
     * ??????????????????
     * @param apis
     */
    apisToDependencies(apis = []) {
        const dependencies = apis.flatMap(api => {
            if (api.parameters) {
                const paramsDependence = api.parameters.flatMap(value => this.getDependence(value.type));
                const resultDependence = this.getDependence(api.result);
                return resultDependence.concat(paramsDependence);
            }
            return this.getDependence(api.result);
        });
        return [...new Set(dependencies)];
    }
    genImportations(apis = [], targetPath, entitiesPath) {
        const dependencies = this.apisToDependencies(apis);
        const relativePath = path__default['default'].relative(targetPath, entitiesPath).split(path__default['default'].sep).join('/');
        return dependencies.map(dep => ({
            name: dep,
            path: relativePath
        }));
    }
    /**
     * ??????????????????
     * @param definitions
     */
    definitionsToDependencies(definitions = []) {
        const dependencies = [];
        definitions.forEach((definition) => {
            dependencies.push(...this.getDependence(definition));
        });
        return [...new Set(dependencies)];
    }
    /**
     * ??????????????????
     * @param type
     * @return {string[]}
     */
    getDependence(type) {
        if (!type) {
            return [];
        }
        if (type.type === 'Array') {
            return this.getDependence(type.items);
        }
        else if (type.type === 'object' && type.properties) {
            return this.definitionsToDependencies(type.properties);
        }
        else if (type.ref) {
            return [type.ref];
        }
        return [];
    }
    getTemplateModel(data) {
        const name = getUpperCamelCase(data.data.prefix ? data.data.prefix + data.name : data.name).replace('Controller', '');
        const model = Object.assign(Object.assign({}, data), { name, filename: `${getKebabCase(name)}.service${data.extension}`, dependencies: this.apisToDependencies(data.apis), importations: this.genImportations(data.apis, data.targetPath, data.entitiesPath), apis: data.apis.map(value => {
                const allParameters = value.parameters == null ? [] : value.parameters;
                const parameters = allParameters
                    .filter(param => ['body', 'path', 'query', 'header'].includes(param.in)).map(param => (Object.assign(Object.assign({}, param), { typeString: getTypeString(param.type) }))).sort((a, b) => {
                    return (+b.required) - (+a.required);
                });
                const dataItems = [];
                const paramsItems = [];
                const headerItems = []; // allParameters.filter(param => param.in === 'header');
                parameters.forEach(param => {
                    if (param.in === 'body') {
                        dataItems.push(param);
                    }
                    else if (param.in === 'path' || param.in === 'query') {
                        paramsItems.push(param);
                    }
                    else if (param.in === 'header') {
                        headerItems.push(param);
                    }
                });
                const apiName = getLowerCamelCase(value.name);
                const apiTypeName = apiName.replace(/(^\w)/, $1 => $1.toUpperCase());
                return Object.assign(Object.assign({}, value), { name: apiName, returnType: getTypeString(value.result), simpleData: dataItems.length <= 1, simpleName: `${apiTypeName}Data`, data: dataItems.length ? {
                        name: `${apiTypeName}Data`,
                        fields: dataItems,
                    } : null, params: paramsItems.length ? {
                        name: `${apiTypeName}Params`,
                        fields: paramsItems
                    } : null, headers: headerItems.length ? {
                        name: `${apiTypeName}Headers`,
                        fields: headerItems
                    } : null });
            }) });
        return Object.assign(Object.assign({}, model), { bodyString() {
                const params = this.params;
                const queryParams = params ? params.filter((value) => value.in === 'query') : [];
                const bodyParams = params ? params.filter((value) => value.in === 'body') : [];
                let str = '';
                if (this.method === 'get') {
                    str += '{';
                    str += queryParams.map(value => value.name).join(', ');
                    str += '}';
                    return str === '{}' ? '' : str;
                }
                else {
                    str += '{';
                    str += bodyParams.map(value => value.name).join(', ');
                    str += '}';
                }
                return str === '{}' ? '' : str;
            },
            queryString() {
                if (this.method === 'get') {
                    return '';
                }
                const params = this.params;
                let str = '{';
                str += params ? params.filter(value => value.in === 'query').map(value => value.name).join(', ') : '';
                str += '}';
                return str === '{}' ? '' : str;
            }, pathString() {
                let str = '`';
                str += this.path.replace(/{/g, '${');
                str += '`';
                return str;
            } });
    }
    getDependencies(data) {
        return this.apisToDependencies(data.apis);
    }
}

/**
 * ?????????????????????????????????
 * @param lang
 * @returns
 */
function genFileExtensionByLang(lang) {
    const langName = lang.toLowerCase();
    let extension = '';
    switch (langName) {
        case 'js':
        case 'javascript':
            extension = '.js';
            break;
        case 'ts':
        case 'typescript':
            extension = '.ts';
            break;
    }
    return extension;
}
/**
 * project.data.baseUrl
 * ?????????baseUrl???????????????path????????????????????????????????????path???????????????baseUrl
 */
function transformPaths(path, baseUrl) {
    let _path = '';
    if (baseUrl) {
        const match = path.match(new RegExp(`/${baseUrl}`));
        const index = match && match.index;
        if (index === 0) {
            const value = match[0];
            _path = path.replace(value, '');
        }
        else {
            _path = path;
        }
    }
    else {
        _path = path;
    }
    return _path;
}
function matchStar(pattern, replacePattern, search) {
    if (search.length < pattern.length) {
        return undefined;
    }
    if (pattern === '*') {
        return createPath(replacePattern, search);
    }
    const star = pattern.indexOf('*');
    if (star === -1) {
        return undefined;
    }
    const part1 = pattern.substring(0, star);
    const part2 = pattern.substring(star + 1);
    if (search.substr(0, star) !== part1) {
        return undefined;
    }
    if (search.substr(search.length - part2.length) !== part2) {
        return undefined;
    }
    return createPath(replacePattern, search.substr(star, search.length - part2.length));
}
function createPath(pattern, search) {
    if (pattern.indexOf('*') !== -1) {
        const star = pattern.substring(0, pattern.indexOf('*'));
        return star + search;
    }
    else {
        return search;
    }
}

class SwaggerParser {
    constructor(url) {
        this.url = url;
        this.response = null;
    }
    loadResponse() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.response = yield axios__default['default'].get(this.url);
            }
            catch (e) {
                throw new Error('swagger?????????????????????\n' + e);
            }
        });
    }
    /**
     * ??????api??????
     */
    getApis(baseUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.response == null) {
                yield this.loadResponse();
            }
            return this.transformApis(this.response.data, baseUrl);
        });
    }
    /**
     * ??????api???????????????
     */
    getApiEntity() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.response == null) {
                yield this.loadResponse();
            }
            return this.transformEntity(this.response.data);
        });
    }
    /**
     * ???swagger????????????????????????????????????
     */
    transformApis(data, baseUrl) {
        const apis = this.pathsToApis(data.paths, baseUrl);
        return data.tags.map((tag) => {
            return Object.assign(Object.assign({}, tag), { apis: apis.filter((value) => value.tags.indexOf(tag.name) !== -1) });
        });
    }
    /**
     * ???swagger???path???????????????????????????
     */
    pathsToApis(paths, baseUrl) {
        return Object.keys(paths).flatMap(pathsKey => {
            const methods = paths[pathsKey];
            return Object.keys(methods).map((methodsKey) => {
                const method = methods[methodsKey];
                return Object.assign(Object.assign({}, method), { path: transformPaths(pathsKey, baseUrl), method: methodsKey, name: this.getApiName(pathsKey, methodsKey), result: this.definitionToType(method.responses['200'].schema), description: method.summary, parameters: method.parameters && method.parameters.map((value) => {
                        return Object.assign(Object.assign({}, value), { type: this.definitionToType(value.schema || value) });
                    }) });
            });
        });
    }
    /**
     * ??????API????????????API??????
     */
    getApiName(path, method) {
        const name = path.replace(/[\/_](\w)/g, ($, $1) => $1.toUpperCase())
            .replace(/[\/]?{(\w)/g, ($, $1) => '$' + $1)
            .replace(/}/g, '');
        return method + name;
    }
    /**
     * ???swagger????????????????????????????????????
     */
    transformEntity(data) {
        return this.definitionsToTypes(data.definitions);
    }
    /**
     * ???swagger???definitions???????????????????????????
     */
    definitionsToTypes(definitions) {
        return Object.keys(definitions || {}).map((definitionKey) => {
            const definition = definitions[definitionKey];
            return Object.assign({ name: this.definitionNameToClassName(definitionKey) }, this.definitionToType(definition));
        });
    }
    /**
     * ???swagger???definitions???????????????????????????
     */
    propertiesToTypes(properties) {
        return Object.keys(properties).map((definitionKey) => {
            const definition = properties[definitionKey];
            return Object.assign({ name: definitionKey }, this.definitionToType(definition));
        });
    }
    /**
     * ??????swagger???type
     */
    definitionToType(definition) {
        if (typeof definition === 'undefined') {
            return;
        }
        const type = {
            description: definition.description
        };
        if (definition.$ref) {
            type.ref = this.refToEntityName(definition.$ref);
            type.type = type.ref;
        }
        else if (definition.type === 'integer') {
            type.type = 'number';
        }
        else if (definition.type === 'array') {
            type.type = 'Array';
            if (definition.items) {
                type.items = this.definitionToType(definition.items);
            }
        }
        else if (definition.type === 'object' && definition.properties !== undefined) {
            type.type = 'object';
            type.properties = this.propertiesToTypes(definition.properties);
        }
        else if (definition.type === 'object' && definition.properties === undefined) {
            type.type = 'any';
        }
        else if (definition.type === 'ref') {
            type.type = 'any';
        }
        else {
            type.type = definition.type;
        }
        return type;
    }
    /**
     * ????????????????????????
     */
    refToEntityName(ref) {
        // ????????? #/definitions/ResultDto??Map??int,string????
        return this.definitionNameToClassName(ref.substring(ref.lastIndexOf('/') + 1));
    }
    definitionNameToClassName(definitionName) {
        return definitionName.replace(/[????,]([a-z]?)/g, ($, $1) => $1.toUpperCase()); // // ???????????????
    }
}

class RequestGenerator extends FileGenerator {
    getTemplateModel(data) {
        return {
            baseUrl: data.data.baseUrl,
            filename: data.name + data.extension,
        };
    }
    generate(data) {
        super.generate(data);
    }
}

const program = require('commander');
const progress = require('child_process');
process.platform === 'win32';
/**
 * ??????service
 */
function generateService(config) {
    return __awaiter(this, void 0, void 0, function* () {
        // rmdirsSync(config.path + config.servicePath);
        const httpServiceGenerator = new HttpServiceGenerator();
        if (!(config.isService || config.isEntity)) {
            return true;
        }
        for (const project of config.projects) {
            const outputDir = path__default['default'].join(config.path, (project.output || ''));
            if (project.output && project.clean) {
                rmdirsSync(outputDir);
            }
            mkdirsSync(outputDir);
            const servicesOutputDir = path__default['default'].join(outputDir, config.servicePath);
            const entitiesOutputDir = path__default['default'].join(outputDir, config.entityPath);
            const parser = new SwaggerParser(project.url);
            const modules = yield parser.getApis(project.data.baseUrl);
            const httpDependencies = modules.flatMap((module) => {
                const includeModule = include(module, config.include);
                const excludedModule = exclude(includeModule, config.exclude);
                if (excludedModule.apis.length > 0) {
                    const targetPath = servicesOutputDir;
                    if (config.isService) {
                        httpServiceGenerator.generate(Object.assign(Object.assign({}, excludedModule), { data: project.data, templatePath: config.serviceTemplatePath, entitiesPath: entitiesOutputDir, extension: genFileExtensionByLang(config.lang), targetPath }));
                    }
                    return httpServiceGenerator.getDependencies(excludedModule);
                }
                return [];
            });
            if (config.isEntity) {
                const entityGenerator = new EntityGenerator();
                const entities = yield parser.getApiEntity();
                const dependencies = getDependencies(entityGenerator, httpDependencies, entities);
                entities
                    .filter((value) => dependencies.includes(value.name))
                    .forEach((entity) => {
                    const targetPath = entitiesOutputDir;
                    entityGenerator.generate(Object.assign(Object.assign({}, entity), { data: project.data, templatePath: config.entityTemplatePath, extension: genFileExtensionByLang(config.lang), targetPath }));
                });
            }
        }
    });
}
/**
 * ??????request ?????????ts
 */
function generateRequest(config) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (config.lang !== 'ts') {
            return;
        }
        const requestGenerator = new RequestGenerator();
        const tsConfig = require(path__default['default'].join(process.cwd(), 'tsconfig'));
        if (!(config.isRequest)) {
            return true;
        }
        for (const project of config.projects) {
            Object.keys((_a = tsConfig === null || tsConfig === void 0 ? void 0 : tsConfig.compilerOptions) === null || _a === void 0 ? void 0 : _a.paths).forEach(key => {
                var _a;
                (_a = tsConfig === null || tsConfig === void 0 ? void 0 : tsConfig.compilerOptions) === null || _a === void 0 ? void 0 : _a.paths[key].forEach((pattern) => {
                    const filePathStar = project.data.requestFunctionFrom.substring(0, project.data.requestFunctionFrom.lastIndexOf('/'));
                    const filePathEnd = project.data.requestFunctionFrom.substring(project.data.requestFunctionFrom.lastIndexOf('/') + 1);
                    const matchPath = matchStar(key, pattern, filePathStar);
                    if (matchPath && project.data.autoGenRequestFile) {
                        const outputDir = path__default['default'].join(process.cwd(), matchStar(key, pattern, filePathStar));
                        const fileObj = {
                            targetPath: `${outputDir}`,
                            name: filePathEnd,
                            extension: genFileExtensionByLang(config.lang)
                        };
                        if (!fs__default['default'].existsSync(`${fileObj.targetPath}${path__default['default'].sep}${fileObj.name}${fileObj.extension}`)) {
                            mkdirsSync(outputDir);
                            requestGenerator.generate(Object.assign({ templatePath: config.requestTemplatePath, data: project.data }, fileObj));
                        }
                    }
                });
            });
        }
    });
}
/**
 * ???????????????????????????class?????????
 * @param entityGenerator class????????????????????????entities??????
 * @param dependencies  ????????????class
 * @param entities ??????class?????????
 * @return ?????????class?????????
 */
function getDependencies(entityGenerator, dependencies, entities) {
    let newDependencies = dependencies; // ?????????dependencies??????
    let mergeDependencies = dependencies; // ?????????dependencies??????
    while (newDependencies.length > 0) {
        // ??????dependencies?????????????????????
        newDependencies = entities
            .filter((value) => newDependencies.includes(value.name)) // ??????newDependencies???entities
            .flatMap((value) => entityGenerator.getDependencies(value)) // ???????????????dependencies??????
            .filter((value) => !mergeDependencies.includes(value)); // ?????????????????????dependencies??????????????????dependencies
        mergeDependencies = mergeDependencies.concat(newDependencies); // ???????????????????????????dependencies??????
    }
    return mergeDependencies;
}
/**
 * ???????????????api
 */
function include(module, includeList) {
    if (!includeList || includeList.length === 0) {
        return Object.assign({}, module);
    }
    return Object.assign(Object.assign({}, module), { apis: module.apis.filter((api) => {
            return includeList.some((value) => {
                return (matching(value.path, api.path) &&
                    (value.methods == null || value.methods.includes(api.method)));
            });
        }) });
}
/**
 * ???????????????????????????api
 */
function exclude(module, excludeList) {
    if (!excludeList || excludeList.length === 0) {
        return Object.assign({}, module);
    }
    return Object.assign(Object.assign({}, module), { apis: module.apis.filter((api) => {
            return !excludeList.some((value) => {
                return (matching(value.path, api.path) &&
                    (value.methods == null || value.methods.includes(api.method)));
            });
        }) });
}
/**
 * ????????????
 */
function matching(reg, input) {
    return micromatch__default['default'].isMatch(input, reg);
}
/**
 * ??????????????????
 */
function copyAssets(config) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!config.assetsPath || config.assetsPath.length === 0) {
            return;
        }
        try {
            mkdirsSync(config.path);
            yield fse__default['default'].copy(config.assetsPath, config.path, { overwrite: true });
        }
        catch (e) {
            throw new Error('??????assets???????????????\n' + e);
        }
    });
}
/**
 * ????????????lint???????????????API?????????
 */
function exceLintProcess(config) {
    return __awaiter(this, void 0, void 0, function* () {
        if (config.lint[0]) {
            console.log('> lint fix');
            yield progress.spawnSync('node', [...config.lint[1].split(' '), config.path + '/**/*.*', '--fix'], {
                stdio: 'inherit',
                cwd: process.cwd()
            });
        }
    });
}
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        program
            .version(require("../package.json").version, "-v, --version") // tslint:disable-line
            .usage('[options]');
        program.option('-c, --config', '??????????????????').parse(process.argv);
        console.log('?????????...');
        const config = loadConfig(program.config);
        try {
            if (config.assetsPath) {
                yield copyAssets(config);
            }
            yield generateService(config);
            yield generateRequest(config);
            console.log('????????????\n');
        }
        catch (e) {
            console.error('????????????');
            console.error(e);
        }
        yield exceLintProcess(config);
    });
})();

exports.generateRequest = generateRequest;
exports.generateService = generateService;

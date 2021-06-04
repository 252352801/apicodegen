import { getLowerCamelCase, getKebabCase, getUpperCamelCase } from '../uitls/caseUtils';
import { getTypeString } from '../uitls/classUtils';
import ClassGenerator from './ClassGenerator';
import { ApiData, Definition, HttpServiceGenerateData, ParametersData, Dependence} from '../core';
import path from 'path';

export default class HttpServiceGenerator extends ClassGenerator {

    generate(data: HttpServiceGenerateData): void {
        super.generate(data);
    }

    /**
     * 获取依赖数组
     * @param apis
     */
    private apisToDependencies(apis: ApiData[] = []): string[] {
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

    genImportations(apis: ApiData[] = [], targetPath: string, entitiesPath: string): Dependence[] {
        const  dependencies = this.apisToDependencies(apis);
        const relativePath = path.join(path.relative(targetPath, entitiesPath), '/');
        return  dependencies.map(dep => ({
            name: dep,
            path: relativePath
        }));
    }

    /**
     * 获取依赖数组
     * @param definitions
     */
    definitionsToDependencies(definitions: Definition[]  = []): string[] {
        const dependencies: string[] = [];
        definitions.forEach((definition)  => {
            dependencies.push(...this.getDependence(definition));
        });
        return [...new Set(dependencies)];
    }

    /**
     * 递归处理依赖
     * @param type
     * @return {string[]}
     */
    private getDependence(type: Definition): string[] {
        if (!type) {
            return [];
        }
        if (type.type === 'Array') {
            return this.getDependence(type.items);
        } else if (type.type === 'object' && type.properties) {
            return this.definitionsToDependencies(type.properties);
        } else if (type.ref) {
            return [type.ref];
        }
        return [];
    }

    getTemplateModel(data: HttpServiceGenerateData): any {
        const name = getUpperCamelCase(data.data.prefix ? data.data.prefix + data.name : data.name).replace('Controller', '');
        const model = {
            ...data,
            name,
            filename: `${getKebabCase(name)}.service${data.extension}`,
            dependencies: this.apisToDependencies(data.apis),
            importations: this.genImportations(data.apis, data.targetPath, data.entitiesPath),
            apis: data.apis.map(value => {
                const allParameters = value.parameters == null ? [] : value.parameters;
                const parameters = allParameters
                .filter(param => ['body', 'path', 'query', 'header'].includes(param.in)).map(param => ({
                        ...param,
                        typeString: getTypeString(param.type)
                })).sort((a, b) => {
                    return (+b.required) - (+a.required);
                });
                const dataItems: any = [];
                const paramsItems: any = [];
                const headerItems: any = []; // allParameters.filter(param => param.in === 'header');
                parameters.forEach(param => {
                    if (param.in === 'body') {
                        dataItems.push(param);
                    } else if (param.in === 'path' || param.in === 'query') {
                        paramsItems.push(param);
                    } else if (param.in === 'header') {
                        headerItems.push(param);
                    }
                });
                const apiName = getLowerCamelCase(value.name);
                const apiTypeName = apiName.replace(/(^\w)/, $1 => $1.toUpperCase());
                return {
                    ...value,
                    name: apiName,
                    returnType: getTypeString(value.result),
                    data: dataItems.length ? {
                        name: `${apiTypeName}Data`,
                        fields: dataItems,
                    } : null,
                    params: paramsItems.length ? {
                        name: `${apiTypeName}Params`,
                        fields: paramsItems
                    } : null,
                    headers: headerItems.length ? {
                        name: `${apiTypeName}Headers`,
                        fields: headerItems
                    } : null,
                };
            }),
        };
        return {
            ...model,
            bodyString() {
                const params: ParametersData[] = this.params;
                const queryParams = params ? params.filter((value: ParametersData) => value.in === 'query') : [];
                const bodyParams = params ? params.filter((value: ParametersData) => value.in === 'body') : [];
                let str = '';
                if (this.method === 'get') {
                    str += '{';
                    str += queryParams.map(value => value.name).join(', ');
                    str += '}';
                    return str === '{}' ? '' : str;
                } else {
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
                const params: ParametersData[] = this.params;
                let str = '{';
                str += params ? params.filter(value => value.in === 'query').map(value => value.name).join(', ') : '';
                str += '}';
                return str === '{}' ? '' : str;
            },
            pathString() {
                let str = '`';
                str += this.path.replace(/{/g, '${');
                str += '`';
                return str;
            }
        };
    }

    getDependencies(data: HttpServiceGenerateData): string[] {
        return this.apisToDependencies(data.apis);
    }
}


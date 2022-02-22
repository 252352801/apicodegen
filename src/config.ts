import path from 'path';
export interface GeneratorConfig {
    path?: string; // 生成后保存路径

    /** service的最后一级目录 */
    servicePath?: string;
    /** entity的最后一级目录 */
    entityPath?: string;
    requestPath?: string;
    serviceTemplatePath?: string;
    entityTemplatePath?: string;
    requestTemplatePath?: string;
    include?: { // 要生成的接口过滤
        path?: string;
        methods?: Array<'get' | 'post' | 'delete' | 'put' | 'options' | 'patch' | 'head'>;
    }[];
    exclude?: { // 不生成的接口过滤
        path?: string;
        methods?: Array<'get' | 'post' | 'delete' | 'put' | 'options' | 'patch' | 'head'>;
    }[];
    projects?: {
        url: string; // api请求路径
        token: string; // yApi token
        data: {
            baseUrl: string; // 生成http文件名baseURL名称
            prefix: string; // 生成http文件名前缀
            requestFunction: string; // request函数名
            requestFunctionFrom: string; // request函数名文件路径
            autoGenRequestFile?: string; // 开启时会根据requestFunctionFrom生成文件
        };
        output?: string; // 输出目录 追加在path后
        clean?: boolean; // 是否生成前清除
    }[];
    apiType?: 'swagger' | 'yapi';
    assetsPath?: string;
    lang?: string; // 语言
    isService?: boolean; // 是否生成services
    isEntity?: boolean; // 是否生成entities
    isRequest?: boolean; // 是否生成request
    lint?: [boolean, string]; // lint修复
}

const defaultConfigPath = 'apicodegen.config.js';

const pkgName = require('../package.json').name;
const defaultConfig: GeneratorConfig = {
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


export function loadConfig(configPath: string = defaultConfigPath): GeneratorConfig {
    const absolutePath = path.join(process.cwd(), configPath);
    try {
        const userConfig: GeneratorConfig = require(absolutePath);
        return { ...defaultConfig, ...userConfig };
    } catch (e) {
        throw new Error(`加载配置文件失败:${absolutePath}\n' ${e}`);
    }
}

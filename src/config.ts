import path from 'path';
export interface GeneratorConfig {
    path?: string; // 生成后保存路径

    /** service的最后一级目录 */
    servicePath?: string;
    /** entity的最后一级目录 */
    entityPath?: string;
    serviceTemplatePath?: string;
    entityTemplatePath?: string;
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
        };
        output?: string; // 输出目录 追加在path后
        clean?: boolean; // 是否生成前清除
    }[];
    apiType?: 'swagger' | 'yapi';
    assetsPath?: string;
    lang?: string; // 语言
    isService?: boolean; // 是否生成services
    isEntity?: boolean; // 是否生成entities
}

const defaultConfigPath = 'apicodegen.config.js';

const pkgName = require('../package.json').name;
const defaultConfig: GeneratorConfig = {
    path: 'src/app/api',
    servicePath: '/services',
    entityPath: '/entities',
    projects: [],
    apiType: 'swagger',
    serviceTemplatePath: `node_modules/${pkgName}/template/service.template.ts`,
    entityTemplatePath: `node_modules/${pkgName}/template/entity.template.ts`,
    // assetsPath: 'node_modules/api-service-generator/template/assets',
    lang: 'ts',
    isService: true,
    isEntity: true
};


export function loadConfig(configPath: string = defaultConfigPath): GeneratorConfig {
    const absolutePath = path.join(process.cwd(), configPath);
    try {
        const userConfig: GeneratorConfig = require(absolutePath);
        return {...defaultConfig, ...userConfig};
    } catch (e) {
        throw new Error(`加载配置文件失败:${absolutePath}\n' ${e}`);
    }
}



module.exports = {
    path: './src/example', //生成后保存路径
    serviceTemplatePath: './template/service.template.ts',
    entityTemplatePath: './template/entity.template.ts',
    requestTemplatePath: './template/request.template.ts',
    include: [
        { path: '/auth/authWriteBack' },
    ], // 包含需要生产的接口
    // exclude: [
    //     {path: '**', methods: ['delete', 'put', 'options', 'patch', 'head']},
    //     {path: '/error'},
    // ], // 不生成的接口过滤，会覆盖include配置
    projects: [
        {
            url: 'http://127.0.0.1:8082/data.json',
            data: {
                baseUrl: 'shopeebiz', // 去掉此项，则 include.path 开头需带上/common 【/common/auth/authWriteBack】
                requestFunction: 'request',
                requestFunctionFrom: '@/request/shopeebiz',
                autoGenRequestFile: false, // 开启此项，将自动生成requestFunctionFrom文件所在路径及代码 可结合tsconfig.compilerOptions.paths
            },
            output: '/api',
            clean: false,
        }
    ],
    lang: 'ts',
    lint: [true, 'node_modules/tslint/bin/tslint -c tslint.json']
    // isEntity: true
    // assetsPath: './template/assets',
};

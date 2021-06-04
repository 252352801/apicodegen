module.exports = {
    path: './example', //生成后保存路径
    serviceTemplatePath: './template/service.template.ts',
    entityTemplatePath: './template/entity.template.ts',
    include: [
        { path: '**' },
    ], // 包含需要生产的接口
    // exclude: [
    //     {path: '**', methods: ['delete', 'put', 'options', 'patch', 'head']},
    //     {path: '/error'},
    // ], // 不生成的接口过滤，会覆盖include配置
    projects: [
        {
            url: 'http://127.0.0.1:8080/data.json',
            data: {
                requestFunction: 'request',
                requestFunctionFrom: '@/core/request',
            },
            output: '/api',
            clean: true,
        }
    ],
    lang: 'ts'
    // isEntity: true
    // assetsPath: './template/assets',
};

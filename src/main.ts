import 'core-js/es7/array';
import fse from 'fs-extra';
import micromatch from 'micromatch';
import { GeneratorConfig, loadConfig } from './config';
import { EntityGenerateData, HttpServiceGenerateData } from './core';
import EntityGenerator from './generator/EntityGenerator';
import HttpServiceGenerator from './generator/HttpServiceGenerator';
import SwaggerParser from './parser/SwaggerParser';
import { mkdirsSync, rmdirsSync } from './uitls/fsUtils';
// import program from 'commander';
import { createPath, genFileExtensionByLang, matchStar } from './uitls';
import path from 'path';
import RequestGenerator from './generator/RequestGenerator';
import { getKebabCase } from './uitls/caseUtils';
import fs from 'fs';
const program = require('commander');
const progress = require('child_process');
const Win32 = process.platform === 'win32';
/**
 * 生成service
 */
export async function generateService(config: GeneratorConfig) {
  // rmdirsSync(config.path + config.servicePath);
  const httpServiceGenerator = new HttpServiceGenerator();
  if (!(config.isService || config.isEntity)) {
    return true;
  }
  for (const project of config.projects) {
    const outputDir = path.join(config.path, (project.output || ''));
    if (project.output && project.clean) {
      rmdirsSync(outputDir);
    }
    mkdirsSync(outputDir);
    const servicesOutputDir = path.join(outputDir, config.servicePath);
    const entitiesOutputDir = path.join(outputDir, config.entityPath);
    const parser = new SwaggerParser(project.url);
    const modules: HttpServiceGenerateData[] = await parser.getApis(project.data.baseUrl);
    const httpDependencies = modules.flatMap((module) => {
      const includeModule = include(module, config.include);
      const excludedModule = exclude(includeModule, config.exclude);
      if (excludedModule.apis.length > 0) {
        const targetPath = servicesOutputDir;
        if (config.isService) {
          httpServiceGenerator.generate({
            ...excludedModule,
            data: project.data,
            templatePath: config.serviceTemplatePath,
            entitiesPath: entitiesOutputDir,
            extension: genFileExtensionByLang(config.lang),
            targetPath,
          });
        }
        return httpServiceGenerator.getDependencies(excludedModule);
      }
      return [];
    });
    if (config.isEntity) {
      const entityGenerator = new EntityGenerator();
      const entities: EntityGenerateData[] = await parser.getApiEntity();
      const dependencies = getDependencies(
        entityGenerator,
        httpDependencies,
        entities
      );
      entities
        .filter((value) => dependencies.includes(value.name))
        .forEach((entity) => {
          const targetPath = entitiesOutputDir;
          entityGenerator.generate({
            ...entity,
            data: project.data,
            templatePath: config.entityTemplatePath,
            extension: genFileExtensionByLang(config.lang),
            targetPath,
          });
        });
    }
  }
}

/**
 * 生成request 只支持ts
 */
export async function generateRequest(config: GeneratorConfig) {
  if (config.lang !== 'ts') {
    return;
  }
  const requestGenerator = new RequestGenerator();
  const tsConfig = require(path.join(process.cwd(), 'tsconfig'));
  if (!(config.isRequest)) {
    return true;
  }
  for (const project of config.projects) {
    Object.keys(tsConfig?.compilerOptions?.paths).forEach(key => {
      tsConfig?.compilerOptions?.paths[key].forEach((pattern: any) => {
        const filePathStar = project.data.requestFunctionFrom.substring(0, project.data.requestFunctionFrom.lastIndexOf('/'));
        const filePathEnd = project.data.requestFunctionFrom.substring(project.data.requestFunctionFrom.lastIndexOf('/') + 1);
        const matchPath = matchStar(key, pattern, filePathStar);
        if (matchPath && project.data.autoGenRequestFile) {
          const outputDir = path.join(process.cwd(), matchStar(key, pattern, filePathStar));
          if (!fs.existsSync(outputDir)) {
            mkdirsSync(outputDir);
            requestGenerator.generate(
              {
                templatePath: config.requestTemplatePath,
                data: project.data,
                targetPath: `${outputDir}`,
                name: filePathEnd,
                extension: genFileExtensionByLang(config.lang)
              }
            );
          }
        }
      });
    });

  }
}

/**
 * 广度优先遍历，获取class的依赖
 * @param entityGenerator class生成器，用于解析entities依赖
 * @param dependencies  待获取的class
 * @param entities 描述class的对象
 * @return 依赖的class名数组
 */
function getDependencies(
  entityGenerator: EntityGenerator,
  dependencies: string[],
  entities: EntityGenerateData[]
): string[] {
  let newDependencies = dependencies; // 待搜索dependencies列表
  let mergeDependencies = dependencies; // 已搜索dependencies列表
  while (newDependencies.length > 0) {
    // 新增dependencies放进待搜索列表
    newDependencies = entities
      .filter((value) => newDependencies.includes(value.name)) // 获取newDependencies的entities
      .flatMap((value) => entityGenerator.getDependencies(value)) // 搜索待搜索dependencies列表
      .filter((value) => !mergeDependencies.includes(value)); // 不存在于已搜索dependencies，所以是新增dependencies
    mergeDependencies = mergeDependencies.concat(newDependencies); // 搜索过的放进已搜索dependencies列表
  }
  return mergeDependencies;
}

/**
 * 包含需要的api
 */
function include(
  module: HttpServiceGenerateData,
  includeList: { path?: string; methods?: Array<string> }[]
) {
  if (!includeList || includeList.length === 0) {
    return { ...module };
  }
  return {
    ...module,
    apis: module.apis.filter((api) => {
      return includeList.some((value) => {
        return (
          matching(value.path, api.path) &&
          (value.methods == null || value.methods.includes(api.method))
        );
      });
    }),
  };
}

/**
 * 过滤掉不需要包含的api
 */
function exclude(
  module: HttpServiceGenerateData,
  excludeList: { path?: string; methods?: Array<string> }[]
) {
  if (!excludeList || excludeList.length === 0) {
    return { ...module };
  }
  return {
    ...module,
    apis: module.apis.filter((api) => {
      return !excludeList.some((value) => {
        return (
          matching(value.path, api.path) &&
          (value.methods == null || value.methods.includes(api.method))
        );
      });
    }),
  };
}

/**
 * 路径匹配
 */
function matching(reg: string, input: string) {
  return micromatch.isMatch(input, reg);
}

/**
 * 拷贝资源文件
 */
async function copyAssets(config: GeneratorConfig) {
  if (!config.assetsPath || config.assetsPath.length === 0) {
    return;
  }
  try {
    mkdirsSync(config.path);
    await fse.copy(config.assetsPath, config.path, { overwrite: true });
  } catch (e) {
    throw new Error('拷贝assets文件失败：\n' + e);
  }
}
/**
 * 扩展执行lint，执行生成API后执行
 */
async function exceLintProcess(config: GeneratorConfig) {
  if (config.lint[0]) {
    console.log('> lint fix');
    await progress.spawnSync('node', [...config.lint[1].split(' '), config.path + '/**/*.*', '--fix'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  }
}

(async function () {
  program
    .version(require("../package.json").version, "-v, --version") // tslint:disable-line
    .usage('[options]');

  program.option('-c, --config', '配置文件路径').parse(process.argv);

  console.log('生成中...');
  const config = loadConfig(program.config);

  try {
    if (config.assetsPath) {
      await copyAssets(config);
    }
    await generateService(config);
    await generateRequest(config);
    console.log('生成完成\n');
  } catch (e) {
    console.error('生成失败');
    console.error(e);
  }
  await exceLintProcess(config);
})();

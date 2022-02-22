import { RequestGeneratorData } from '@/core';
import FileGenerator from './FileGenerator';

export default class RequestGenerator　extends FileGenerator {
  getTemplateModel(data: RequestGeneratorData): any {
    return {
      baseUrl: data.data.baseUrl,
      filename: data.name + data.extension,
    };
  }
  generate(data: RequestGeneratorData): void {
    super.generate(data);
  }
}

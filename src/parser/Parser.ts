import { EntityGenerateData, HttpServiceGenerateData } from '../core';

export default interface Parser {
    getApis(baseUrl?: string): Promise<HttpServiceGenerateData[]>;

    getApiEntity(): Promise<EntityGenerateData[]>;
}

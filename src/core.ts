import { ClassGenerateData } from './generator/ClassGenerator';

export interface GenerateData {
    data?: { [key: string]: any};
    description?: string;
    templatePath: string;
}

export interface FileGenerateData extends GenerateData {
    targetPath: string;
}

export interface EntityGenerateData extends ClassGenerateData {
    description?: string;
    dependencies: string[];
    type: string;
    extension?: string;
    properties: Definition[];
}

export interface HttpServiceGenerateData extends ClassGenerateData {
    description?: string;
    dependencies: string[];
    apis?: ApiData[];
    prefix?: string;
    extension?: string;
    entitiesPath?: string;
}

export interface RequestGeneratorData extends ClassGenerateData {
    description?: string;
    extension?: string;
}
export interface ApiData {
    description?: string;
    method?: 'get' | 'post' | 'delete' | 'put' | 'options' | 'patch' | 'head';
    name?: string;
    path?: string;
    result?: Definition;
    parameters?: ParametersData[];
}
export interface Definition {
    name: string;
    description?: string;
    items?: Definition;
    type?: string;
    ref?: string;
    properties?: Definition[];
}
export interface ParametersData {
    description?: string;
    'in': 'body' | 'query' | 'path' | 'header';
    name?: string;
    required?: boolean;
    type?: Definition;
}

export interface Dependence {
    name: string;
    path: string;
}

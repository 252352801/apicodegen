module.exports = `import {{{data.requestFunction}}} from '{{{data.requestFunctionFrom}}}';
{{#importations}}
import { {{{name}}} } from '{{{path}}}/{{{name}}}';
{{/importations}}

{{#description}}
/** {{{.}}} */
{{/description}}

  {{#apis}}
// **********************************************************************************


  {{#data}}
  {{^simpleData}}
  export interface {{{name}}} {
    {{#fields}}
    /** {{{description}}} */
    {{{name}}}{{^required}}?{{/required}}: {{{typeString}}};
    {{/fields}}
  }
  {{/simpleData}}
  {{#simpleData}}
  {{#fields}}
  /** {{{description}}} */
  export type {{{simpleName}}} = {{{typeString}}};
  {{/fields}}
  {{/simpleData}}\n
  {{/data}}
  {{#params}}
  export interface {{{name}}} {
    {{#fields}}
    /** {{{description}}} */
    {{{name}}}{{{^required}}}?{{{/required}}}: {{{typeString}}};
    {{/fields}}
  }\n
  {{/params}}
  /**
   * {{{description}}}{{#deprecated}}\n
   * @deprecated{{/deprecated}}{{#data}}
   * @param data <{{{name}}}>\n{{/data}}{{#params}}\n
   * @param params <{{{name}}}>\n{{/params}}
   * @param options (axios)请求选项参数
   */
  export function {{{name}}}({{#data}}data: {{{name}}}, {{/data}}{{#params}}params: {{{name}}},{{/params}}
    options?: { {{#headers}}headers?: { {{#fields}}{{{name}}}?: {{{typeString}}}; {{/fields}} }; {{/headers}}[key: string]: any }): Promise<{{{returnType}}}> {
    return {{{data.requestFunction}}}({
      url: {{{pathString}}},
      method: '{{method}}'{{#data}},
      data{{/data}}{{#params}},
      params{{/params}},
      ...options
    });
  }

  {{/apis}}
`;

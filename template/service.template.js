module.exports = `import {{{data.requestFunction}}} from '{{{data.requestFunctionFrom}}}';

{{#description}}
/** {{{.}}} */
{{/description}}

  {{#apis}}

  /**
   * {{{description}}}{{#deprecated}}
   * @deprecated{{/deprecated}}{{#data}}
   * @param data \n{{/data}}{{#params}}
   * @param params \n{{/params}}
   * @param options (axios)请求选项参数
   * @returns Promise}
   */
  export function {{{name}}}({{#data}}data, {{/data}}{{#params}}params, {{/params}}options) {
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

module.exports = `
{{#dependencies}}
import { {{{.}}} } from './{{{.}}}';
{{/dependencies}}

export interface {{name}} {
  {{#properties}}
{{#description}}    /** {{{.}}} */{{/description}}
    {{{name}}}?: {{{typeStr}}};
  {{/properties}}
}

`;

import { SequelizeSGSchema, SGPluginConfig, SGPluginOptions } from '..'

declare module '..' {
  export interface SGPluginOptionsMap {
    version?: SGPluginOptions
  }
}

export default {
  name: 'version',
  defaultOptions: {
    enable: true
  },
  priority: 100,
  description: 'Add version field to Schema',
  applyToSchema: (schema, options, schemas) => {
    if (schema instanceof SequelizeSGSchema) {
      const versionConfig = (schema.options.tableOptions || {}).version
      if (versionConfig === true || typeof versionConfig === 'string') {
        const versionField =
          typeof versionConfig === 'string' ? versionConfig : 'version'
        schema.fields({
          [versionField]: {
            type: 'Integer',
            nullable: false,
            metadata: {
              graphql: {
                initializable: false,
                updatable: false
              }
            }
          }
        })
      }
    }
  }
} as SGPluginConfig

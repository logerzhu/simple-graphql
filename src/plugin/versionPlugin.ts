import { PluginConfig, PluginOptions } from '../Definition'

declare module '../Definition' {
  export interface PluginOptionsMap {
    version?: PluginOptions
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
} as PluginConfig

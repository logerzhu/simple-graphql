// @flow
import type { PluginOptions } from '../Definition'

export default ({
  key: 'version',
  defaultOptions: true,
  priority: 100,
  description: 'Add version field to Schema',
  apply: (schema, options, schemas) => {
    const versionConfig = (schema.config.options.tableOptions || {}).version
    if (versionConfig === true || typeof versionConfig === 'string') {
      const versionField = typeof versionConfig === 'string' ? versionConfig : 'version'
      schema.fields({
        [versionField]: {
          $type: 'Integer',
          required: true,
          config: {
            initializable: false,
            mutable: false
          }
        }
      })
    }
  }
}: PluginOptions)

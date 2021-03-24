import Schema from '../definition/Schema'
import { PluginConfig, PluginOptions, PluginOptionsMap } from '../Definition'

export default (
  schemas: Array<Schema>,
  plugins: Array<PluginConfig>,
  defaultOptions: PluginOptionsMap
) => {
  const result: {
    [key: string]: Schema
  } = {}

  plugins.forEach((plugin) => {
    for (const schema of schemas) {
      let options: PluginOptions = ((schema.config.options || {}).plugin || {})[
        plugin.name
      ]
      if (options === undefined) {
        options = defaultOptions[plugin.name]
      }
      if (options === undefined) {
        options = plugin.defaultOptions
      }
      if (options != null && options.enable === true && plugin.applyToSchema) {
        plugin.applyToSchema(schema, options, schemas)
      }
    }
  })
  schemas.forEach((schema) => {
    result[schema.name] = schema
  })
  return result
}

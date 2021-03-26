import { SGSchema } from '../definition/SGSchema'
import { PluginConfig, PluginOptions, PluginOptionsMap } from '../Definition'

export default (
  schemas: Array<SGSchema>,
  plugins: Array<PluginConfig>,
  defaultOptions: PluginOptionsMap
) => {
  const result: {
    [key: string]: SGSchema
  } = {}

  plugins.forEach((plugin) => {
    for (const schema of schemas) {
      let options: PluginOptions | null | undefined = ((schema.options || {})
        .plugin || {})[plugin.name]
      if (options === undefined) {
        options = defaultOptions[plugin.name]
      }
      if (options === undefined) {
        options = plugin.defaultOptions
      }
      if (options != null && options.enable && plugin.applyToSchema) {
        plugin.applyToSchema(schema, options, schemas)
      }
    }
  })
  schemas.forEach((schema) => {
    result[schema.name] = schema
  })
  return result
}

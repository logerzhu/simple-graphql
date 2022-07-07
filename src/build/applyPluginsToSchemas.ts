import { SequelizeSGSchema } from '../definition/SequelizeSGSchema'
import { SGPluginConfig, SGPluginOptions, SGPluginOptionsMap } from '..'

export default (
  schemas: Array<SequelizeSGSchema>,
  plugins: Array<SGPluginConfig>,
  defaultOptions: SGPluginOptionsMap
) => {
  const result: {
    [key: string]: SequelizeSGSchema
  } = {}

  plugins.forEach((plugin) => {
    for (const schema of schemas) {
      let options: SGPluginOptions | null | undefined = ((schema.options || {})
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

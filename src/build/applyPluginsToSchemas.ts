import {
  SGBuildOptions,
  SGPluginConfig,
  SGPluginOptions
} from '..'
import { BaseSGSchema } from '../definition/BaseSGSchema'

export default (
  schemas: Array<BaseSGSchema>,
  plugins: Array<SGPluginConfig>,
  buildOptions: SGBuildOptions
) => {
  const result: {
    [key: string]: BaseSGSchema
  } = {}

  const schemaMap: { [name: string]: BaseSGSchema } = {}
  schemas.forEach((schema) => (schemaMap[schema.name] = schema))

  const defaultOptions = buildOptions.defaultPlugin || {}
  plugins.forEach((plugin) => {
    for (const schema of schemas) {
      let options: SGPluginOptions | null | undefined = ((schema.options || {})
        .plugin || {})[plugin.name]
      if (options === undefined) {
        options = defaultOptions[plugin.name]
      }
      if (options === undefined) {
        if (typeof plugin.defaultOptions === 'function') {
          options = plugin.defaultOptions(schema)
        } else {
          options = plugin.defaultOptions
        }
      }
      if (options != null && options.enable && plugin.applyToSchema) {
        plugin.applyToSchema(schema, options, schemaMap, buildOptions)
      }
    }
  })
  schemas.forEach((schema) => {
    result[schema.name] = schema
  })
  return result
}

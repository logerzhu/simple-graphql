import Schema from '../definition/Schema'
import { PluginOptions } from '../Definition'

export default (schemas: Array<Schema>, plugins: Array<PluginOptions>, defaultOptions: {
    [id: string]: boolean | Object;
}) => {
  const result: {
        [key: string]: Schema;
    } = {}

  plugins.forEach(plugin => {
    for (const schema of schemas) {
      let options = ((schema.config.options || {}).plugin || {})[plugin.name]
      if (options === undefined) {
        options = defaultOptions[plugin.name]
      }
      if (options === undefined) {
        options = plugin.defaultOptions
      }
      if (options != null && options !== false && plugin.applyToSchema) {
        plugin.applyToSchema(schema, options, schemas)
      }
    }
  })
  schemas.forEach(schema => {
    result[schema.name] = schema
  })
  return result
}

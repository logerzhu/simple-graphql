// @flow
import Schema from '../definition/Schema'
import innerPlugins from '../plugin'
import type { Plugin } from '../Definition'

export default (schemas: Array<Schema>, plugins: Array<Plugin>, defaultOptions: { [id: string]: boolean | Object }) => {
  const result: { [string]: Schema } = {};

  [...innerPlugins, ...plugins].sort((p1, p2) => {
    const p1n = p1.priority || 0
    const p2n = p2.priority || 0
    if (p1n < p2n) {
      return 1
    } else if (p1n > p2n) {
      return -1
    } else {
      return 0
    }
  }).forEach(plugin => {
    for (let schema of schemas) {
      let options = ((schema.config.options || {}).plugin || {})[plugin.key]
      if (options === undefined) {
        options = defaultOptions[plugin.key]
      }
      if (options === undefined) {
        options = plugin.defaultOptions
      }
      if (options !== undefined) {
        plugin.apply(schema, options, schemas)
      }
    }
  })
  schemas.forEach(schema => { result[schema.name] = schema })
  return result
}

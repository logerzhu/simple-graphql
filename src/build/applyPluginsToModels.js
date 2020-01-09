// @flow
import type { ModelDefine, PluginOptions } from '../Definition'
import innerPlugins from '../plugin'

export default (models: Array<ModelDefine>, plugins: Array<PluginOptions>, defaultOptions: { [id: string]: boolean | Object }) => {
  const result: { [string]: ModelDefine } = {};

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
    for (let model of models) {
      let options = ((model.schema.config.options || {}).plugin || {})[plugin.name]
      if (options === undefined) {
        options = defaultOptions[plugin.name]
      }
      if (options === undefined) {
        options = plugin.defaultOptions
      }
      if (options != null && options !== false && plugin.applyToModel) {
        plugin.applyToModel(model, options, models)
      }
    }
  })
  models.forEach(model => { result[model.name] = model })
  return result
}

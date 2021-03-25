import { PluginConfig, PluginOptionsMap, SGModelCtrl } from '../Definition'

export default (
  models: Array<SGModelCtrl>,
  plugins: Array<PluginConfig>,
  defaultOptions: PluginOptionsMap
) => {
  const result: {
    [key: string]: SGModelCtrl
  } = {}

  plugins.forEach((plugin) => {
    for (const model of models) {
      let options = ((model.sgSchema.options || {}).plugin || {})[plugin.name]
      if (options === undefined) {
        options = defaultOptions[plugin.name]
      }
      if (options === undefined) {
        options = plugin.defaultOptions
      }
      if (options != null && options.enable === true && plugin.applyToModel) {
        plugin.applyToModel(model, options, models)
      }
    }
  })
  models.forEach((model) => {
    result[model.name] = model
  })
  return result
}

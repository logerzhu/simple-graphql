import { SGModelCtrl, PluginConfig, PluginsOptionsType } from '../Definition'

export default (
  models: Array<SGModelCtrl>,
  plugins: Array<PluginConfig>,
  defaultOptions: PluginsOptionsType
) => {
  const result: {
    [key: string]: SGModelCtrl
  } = {}

  plugins.forEach((plugin) => {
    for (const model of models) {
      let options = ((model.sgSchema.config.options || {}).plugin || {})[
        plugin.name
      ]
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
  models.forEach((model) => {
    result[model.name] = model
  })
  return result
}

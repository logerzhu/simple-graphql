import { ModelDefine, PluginOptions, PluginsOptionsType } from '../Definition'

export default (
  models: Array<ModelDefine>,
  plugins: Array<PluginOptions>,
  defaultOptions: PluginsOptionsType
) => {
  const result: {
    [key: string]: ModelDefine
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


import { ModelDefine, PluginOptions } from "../Definition";

export default ((models: Array<ModelDefine>, plugins: Array<PluginOptions>, defaultOptions: {
  [id: string]: boolean | Object;
}) => {
  const result: {
    [key: string]: ModelDefine;
  } = {};

  plugins.forEach(plugin => {
    for (let model of models) {
      let options = ((model.schema.config.options || {}).plugin || {})[plugin.name];
      if (options === undefined) {
        options = defaultOptions[plugin.name];
      }
      if (options === undefined) {
        options = plugin.defaultOptions;
      }
      if (options != null && options !== false && plugin.applyToModel) {
        plugin.applyToModel(model, options, models);
      }
    }
  });
  models.forEach(model => {result[model.name] = model;});
  return result;
});
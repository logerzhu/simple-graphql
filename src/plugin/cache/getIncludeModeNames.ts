import {
  CountOptions,
  FindOptions,
  Includeable,
  IncludeOptions
} from 'sequelize'
import _ from 'lodash'

export default (options?: FindOptions | CountOptions) => {
  if (!options) {
    return []
  }
  const ins: string[] = []
  const addInclude = (include?: Includeable | Includeable[]) => {
    if (Array.isArray(include)) {
      include.forEach((i) => addInclude(i))
    } else if (include) {
      const model = (include as IncludeOptions).model
      if (model) {
        ins.push(model.name)
      }
      addInclude((include as IncludeOptions).include)
    }
  }
  addInclude(options.include)
  return _.uniq(ins).sort()
}

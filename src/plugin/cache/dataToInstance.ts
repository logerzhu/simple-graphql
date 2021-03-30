import { SGModel, SGModelCtrl } from '../../Definition'
import { Includeable, IncludeOptions } from 'sequelize'

function restoreTimestamps(
  data: any,
  instance: SGModel,
  include?: Includeable | Includeable[]
) {
  const timestampFields = ['createdAt', 'updatedAt', 'deletedAt']

  for (const field of timestampFields) {
    const value = data[field]
    if (value) {
      instance.setDataValue(field, new Date(value))
    }
  }
  if (data['version'] != null) {
    instance.setDataValue('version', data['version'])
  }

  const restore = (includeItem: Includeable) => {
    if ((includeItem as IncludeOptions).as) {
      const item = includeItem as IncludeOptions
      const field = item.as as string
      if (data[field]) {
        if (Array.isArray(data[field])) {
          for (let index = 0; index < data[field].length; index++) {
            restoreTimestamps(
              data[field][index],
              instance[field][index],
              item.include
            )
          }
        } else {
          restoreTimestamps(data[field], instance[field], item.include)
        }
      }
    }
  }

  if (Array.isArray(include)) {
    include.forEach((i) => restore(i))
  } else if (include) {
    restore(include)
  }
}

export default function (
  data,
  model: SGModelCtrl,
  include?: Includeable | Includeable[]
) {
  if (!data) {
    return data
  }
  const instance = model.build(data, {
    isNewRecord: false,
    raw: false,
    include
  })
  if (Array.isArray(include)) {
    restoreTimestamps(data, instance, include)
  } else if (include != null) {
    restoreTimestamps(data, instance, [include])
  } else {
    restoreTimestamps(data, instance, [])
  }

  return instance
}

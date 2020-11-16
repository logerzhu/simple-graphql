import {ModelDefine, SGModel} from "../../Definition";
import {Includeable, IncludeOptions} from "sequelize";

function restoreTimestamps(data: any, instance: SGModel, include?: Includeable[]) {
  const timestampFields = ['createdAt', 'updatedAt', 'deletedAt', 'version']

  for (const field of timestampFields) {
    const value = data[field]
    if (value) {
      instance.setDataValue(field as any, new Date(value))
    }
  }

  for (let i of (include || []) as IncludeOptions[]) {
    if (data[i.as]) {
      if (Array.isArray(data[i.as])) {
        for (let index = 0; index < data[i.as].length; index++) {
          restoreTimestamps(data[i.as][index], instance[i.as][index], i.include as IncludeOptions[])
        }
      } else {
        restoreTimestamps(data[i.as], instance[i.as], i.include as IncludeOptions[])
      }
    }
  }
}

export default function (data, model: ModelDefine, include?: Includeable[]) {
  if (!data) {
    return data
  }
  const instance = model.build(data, {isNewRecord: false, raw: false, include})
  restoreTimestamps(data, instance, include)
  return instance
}

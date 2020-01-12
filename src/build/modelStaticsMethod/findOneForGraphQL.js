// @flow
import type { FindOptions } from 'sequelize'

export default async function (options: FindOptions<any>, info: Object, path?: string) {
  const dbModel = this

  const option = dbModel.resolveQueryOption({
    attributes: options.attributes,
    include: options.include,
    order: options.order,
    info: info,
    path: path
  })

  return (dbModel.withCache ? dbModel.withCache : dbModel).findOne({
    ...options,
    include: option.include,
    attributes: option.attributes,
    order: option.order
  })
}

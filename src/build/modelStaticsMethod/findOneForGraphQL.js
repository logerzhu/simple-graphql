// @flow
import type { FindOptions } from 'sequelize'
import Sequelize from 'sequelize'
import DataLoader from 'dataloader'
import _ from 'lodash'

export default async function (options: FindOptions<any>, info: Object, path?: string) {
  const dbModel = this

  const canEval = function (options) {
    if (options.order || options.include || options.attributes) {
      return false
    }
    const where: any = options.where || {}
    if (_.keys(where).join(',') === 'id' && (typeof where.id === 'number' || typeof where.id === 'string')) {
      return true
    }
    return false
  }

  const isMatch = function (record, where) {
    return record.id + '' === where.id + ''
  }

  if (canEval(options)) {
    dbModel.__dataLoaders = dbModel.__dataLoaders || {}

    const option = dbModel.resolveQueryOption({
      info: info,
      path: path
    })

    const loaderName = `findOne-${option.attributes.join('_')}`
    if (!dbModel.__dataLoaders[loaderName]) {
      dbModel.__dataLoaders[loaderName] = new DataLoader(async function (wheres) {
        const option = dbModel.resolveQueryOption({
          info: info,
          path: path
        })
        const records = await dbModel.findAll({
          where: { [Sequelize.Op.or]: wheres },
          include: option.include,
          attributes: option.attributes,
          order: option.order
        })
        return wheres.map(w => records.find(r => isMatch(r, w)))
      }, { cache: false })
    }
    return dbModel.__dataLoaders[loaderName].load(options.where)
  }

  const option = dbModel.resolveQueryOption({
    attributes: options.attributes,
    include: options.include,
    order: options.order,
    info: info,
    path: path
  })

  return dbModel.findOne({
    ...options,
    include: option.include,
    attributes: option.attributes,
    order: option.order
  })
}

import Sequelize, { FindOptions, Includeable } from 'sequelize'
import DataLoader from 'dataloader'
import { GraphQLResolveInfo } from 'graphql'
import getFindOptionsKey from '../../plugin/cache/getFindOptionsKey'
import { SGModel, SGModelCtrl } from '../../index'

export default async function <M extends SGModel>(
  this: SGModelCtrl<M>,
  id: number,
  options: FindOptions,
  context: any,
  info: GraphQLResolveInfo,
  path?: string
): Promise<M | null> {
  const dbModel = this

  if (context == null) context = {}
  if (!context._SGLoaders) context._SGLoaders = {}

  const option = dbModel.resolveQueryOption({
    attributes: options.attributes as string[],
    include: options.include as Includeable[],
    info: info,
    path: path
  })

  const key = `${dbModel.name}.findByPk|${getFindOptionsKey(dbModel, option)}`

  if (!context._SGLoaders[key]) {
    context._SGLoaders[key] = new DataLoader(async function (ids) {
      const condition = {
        where: {
          id: { [Sequelize.Op.in]: ids }
        },
        include: option.include,
        attributes: option.attributes
      }
      const mapResult = (records) =>
        ids.map((id) => records.find((r) => r.id + '' === id + ''))
      if (dbModel.withCache) {
        return mapResult(await dbModel.withCache().findAll(condition))
      } else {
        return mapResult(await dbModel.findAll(condition))
      }
    })
  }

  return context._SGLoaders[key].load(id)
}

import { FindOptions, Includeable } from 'sequelize'
import { GraphQLResolveInfo } from 'graphql'
import DataLoader from 'dataloader'
import getFindOptionsKey from '../../plugin/cache/getFindOptionsKey'
import { SGModel, SGModelCtrl } from '../../index'

export default async function <M extends SGModel>(
  this: SGModelCtrl<M>,
  options: FindOptions,
  context: any,
  info: GraphQLResolveInfo,
  path?: string
): Promise<M | null> {
  const dbModel = this

  if (context == null) context = {}
  if (!context._SGLoaders) context._SGLoaders = {}

  const key = `${dbModel.name}.findOne`

  if (!context._SGLoaders[key]) {
    context._SGLoaders[key] = new DataLoader<FindOptions, M | null, string>(
      async function (conditions) {
        const result: (M | null)[] = []
        for (let cond of conditions) {
          if (dbModel.withCache) {
            result.push(await dbModel.withCache().findOne(cond))
          } else {
            result.push(await dbModel.findOne(cond))
          }
        }
        return result
      },
      {
        maxBatchSize: 1,
        cacheKeyFn: (k) => getFindOptionsKey(dbModel, k)
      }
    )
  }

  const option = dbModel.resolveQueryOption({
    attributes: options.attributes as string[],
    include: options.include,
    order: options.order,
    info: info,
    path: path
  })

  return context._SGLoaders[key].load({
    ...options,
    include: option.include,
    attributes: option.attributes,
    order: option.order
  })
}

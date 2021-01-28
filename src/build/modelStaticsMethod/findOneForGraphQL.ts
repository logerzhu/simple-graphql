import { FindOptions, Includeable } from 'sequelize'
import { GraphQLResolveInfo } from 'graphql'
import DataLoader from 'dataloader'
import getFindOptionsKey from '../../plugin/cache/getFindOptionsKey'
import { SGModel } from '../../Definition'

export default async function <M extends SGModel>(
  this: { new (): M } & typeof SGModel,
  options: FindOptions,
  context: any,
  info: GraphQLResolveInfo,
  path?: string
) {
  const dbModel = this

  if (context == null) context = {}
  if (!context._SGLoaders) context._SGLoaders = {}

  const key = `${dbModel.name}.findOne`

  if (!context._SGLoaders[key]) {
    context._SGLoaders[key] = new DataLoader(
      async function (conditions) {
        const result = []
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
    include: options.include as Includeable[],
    order: options.order as any,
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

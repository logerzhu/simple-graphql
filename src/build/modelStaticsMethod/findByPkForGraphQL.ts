import Sequelize, {FindOptions} from "sequelize";
import DataLoader from "dataloader";
import {GraphQLResolveInfo} from "graphql";
import {SGModel} from "../../Definition";
import getFindOptionsKey from "../../plugin/cache/getFindOptionsKey";

export default async function <M extends SGModel>(this: { new(): M } & typeof SGModel, id: number, options: FindOptions, context: any, info: GraphQLResolveInfo, path?: string) {
  const dbModel = this;

  if (context == null) context = {};
  if (!context._SGLoaders) context._SGLoaders = {};

  const option = dbModel.resolveQueryOption({
    attributes: options.attributes as string[],
    include: options.include,
    info: info,
    path: path
  });

  const key = `${dbModel.name}.findByPk|${getFindOptionsKey(dbModel, option)}`

  if (!context._SGLoaders[key]) {
    context._SGLoaders[key] = new DataLoader(async function (ids) {
      const condition = {
        where: {
          id: {[Sequelize.Op.in]: ids}
        },
        include: option.include,
        attributes: option.attributes
      }
      const mapResult = (records) => ids.map(id => records.find(r => r.id + '' === id + ''))
      if (dbModel.withCache) {
        return mapResult(await dbModel.withCache().findAll(condition))
      } else {
        return mapResult(await dbModel.findAll(condition))
      }
    });
  }

  return context._SGLoaders[key].load(id);
}
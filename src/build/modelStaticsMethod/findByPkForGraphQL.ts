import Sequelize, {FindOptions} from "sequelize";
import DataLoader from "dataloader";
import {GraphQLResolveInfo} from "graphql";

export default async function (id: number, options: FindOptions, context: any, info: GraphQLResolveInfo, path?: string) {
    const dbModel = this;

    if (context == null) context = {};
    if (!context._SGLoaders) context._SGLoaders = {};

    const option = dbModel.resolveQueryOption({
        attributes: options.attributes,
        include: options.include,
        info: info,
        path: path
    });

    const key = dbModel.name + '-' + JSON.stringify(option);
    if (!context._SGLoaders[key]) {
        context._SGLoaders[key] = new DataLoader(async function (ids) {
            const records = await (dbModel.withCache ? dbModel.withCache() : dbModel).findAll({
                where: {
                    id: {[Sequelize.Op.in]: ids}
                },
                include: option.include,
                attributes: option.attributes
            });
            return ids.map(id => records.find(r => r.id + '' === id + ''));
        });
    }

    return context._SGLoaders[key].load(id);
}
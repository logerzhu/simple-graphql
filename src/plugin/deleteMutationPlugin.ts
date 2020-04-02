import StringHelper from "../utils/StringHelper";
import {PluginOptions} from "../Definition";

export default ({
    name: 'deleteMutation',
    defaultOptions: false,
    priority: 0,
    description: 'Gen `delete mutation` for Schema',
    applyToSchema: function (schema, options, schemas): void {
        const name = 'delete' + StringHelper.toInitialUpperCase(schema.name);
        let config = {};
        if (typeof options === 'object') {
            config = options;
        }
        schema.mutations({
            [config.name || name]: {
                config: config,
                inputFields: {
                    id: {
                        $type: schema.name + 'Id',
                        required: true
                    }
                },
                outputFields: {
                    ['deleted' + schema.name]: schema.name
                },
                mutateAndGetPayload: async function ({
                                                         id
                                                     }, context, info, sgContext) {
                    const entity = await sgContext.models[schema.name].findOne({where: {id: id}});
                    if (entity) {
                        await entity.destroy();
                        return {
                            ['deleted' + schema.name]: entity
                        };
                    }
                    throw new Error(schema.name + '[' + id + '] not exist.');
                }
            }
        });
    }
} as PluginOptions);
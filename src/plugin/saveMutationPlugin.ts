import _ from "lodash";
import {ColumnFieldOptions, PluginOptions} from "../Definition";
import StringHelper from "../utils/StringHelper";

export default ({
    name: 'saveMutation',
    defaultOptions: false,
    priority: 0,
    description: 'Gen `save mutation` for Schema',
    applyToSchema: function (schema, options, schemas) {
        const name = 'save' + StringHelper.toInitialUpperCase(schema.name);
        const savedName = 'saved' + StringHelper.toInitialUpperCase(schema.name);

        const inputFields = {};
        const isModelType = (fieldOptions: ColumnFieldOptions) => {
            if (typeof fieldOptions === 'string') {
                return schemas.find(s => s.name === fieldOptions) != null;
            } else if (typeof fieldOptions === 'object') {
                return schemas.find(s => s.name === (fieldOptions as any).$type) != null;
            }
            return false;
        };
        _.forOwn(schema.config.fields, (value, key) => {
            if (isModelType(value)) {
                if (!key.endsWith('Id')) {
                    key = key + 'Id';
                }
            }

            if (value && value.$type) {
                if (!value.hidden) {
                    inputFields[key] = {...value, resolve: null};
                }
            } else {
                inputFields[key] = value;
            }
        });
        let config = {};
        if (typeof options === 'object') {
            config = options;
        }
        schema.mutations({
            [config.name || name]: {
                config: config,
                inputFields: inputFields,
                outputFields: {
                    [savedName]: schema.name
                },
                mutateAndGetPayload: async function (args, context, info, sgContext) {
                    const dbModel = sgContext.models[schema.name];
                    const attrs = {};

                    _.forOwn(schema.config.fields, (value, key) => {
                        if (isModelType(value)) {
                            if (!key.endsWith('Id')) {
                                key = key + 'Id';
                            }
                            if (typeof args[key] !== 'undefined') {
                                if (dbModel.options.underscored) {
                                    attrs[StringHelper.toUnderscoredName(key)] = args[key];
                                } else {
                                    attrs[key] = args[key];
                                }
                            }
                        } else if (typeof args[key] !== 'undefined') {
                            attrs[key] = args[key];
                        }
                    });

                    await dbModel.upsert(attrs);
                    return {
                        [savedName]: dbModel.findOne({where: attrs})
                    };
                }
            }
        });
    }
} as PluginOptions);
import _ from "lodash";
import {ColumnFieldOptions, ColumnFieldOptionsType, PluginOptions} from "../Definition";
import StringHelper from "../utils/StringHelper";

export default ({
    name: 'addMutation',
    defaultOptions: false,
    priority: 0,
    description: 'Gen `add mutation` for Schema',
    applyToSchema: function (schema, options, schemas) {
        const name = 'add' + StringHelper.toInitialUpperCase(schema.name);
        const addedName = 'added' + StringHelper.toInitialUpperCase(schema.name) + 'Edge';

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

            if (value && (<ColumnFieldOptionsType>value).$type) {
                if (!(<ColumnFieldOptionsType>value).hidden && (!(<ColumnFieldOptionsType>value).config || (<ColumnFieldOptionsType>value).config.initializable !== false)) {
                    inputFields[key] = {...(<ColumnFieldOptionsType>value), resolve: null};
                }
            } else {
                inputFields[key] = value;
            }
        });
        let config: { [key: string]: any } = {};
        if (typeof options === 'object') {
            config = options;
        }
        schema.mutations({
            [config.name || name]: {
                config: config,
                inputFields: inputFields,
                outputFields: {
                    [addedName]: schema.name + 'Edge'
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

                    const instance = await dbModel.create(attrs);
                    return {
                        [addedName]: {
                            node: instance,
                            cursor: (<any>instance).id
                        }
                    };
                }
            }
        });
    }
} as PluginOptions);
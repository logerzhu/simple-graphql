import {
    BaseDataTypeOptions,
    ColumnFieldOptions,
    ColumnFieldOptionsType,
    DataTypeOptions,
    FieldType,
    FieldTypeContext,
    InterfaceContext,
    ResolverContext,
    UnionDataTypeOptions
} from "../Definition";
import Schema from "../definition/Schema";
import {GraphQLFloat, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLUnionType} from "graphql";
import * as relay from "graphql-relay";
import toGraphQLFieldConfigMap from "../transformer/toGraphQLFieldConfigMap";
import globalIdType from "./fieldType/globalIdType";
import unionInputType from "./fieldType/unionInputType";
import Sequelize, {ModelAttributeColumnOptions} from "sequelize";
import _ from "lodash";
import toGraphQLInputFieldConfigMap from "../transformer/toGraphQLInputFieldConfigMap";
import innerFieldTypes from "./fieldType";
import innerDataTypes from "./dataType";

type Context = ResolverContext & InterfaceContext;

function buildModelType(schema: Schema, fieldTypeContext: FieldTypeContext, context: Context): FieldType {
    const typeName = schema.name;
    return {
        name: typeName,
        description: schema.config.options.description,
        inputType: (fieldTypeContext.fieldType(schema.name + 'Id') as any).inputType,
        outputType: new GraphQLObjectType({
            name: typeName,
            interfaces: [context.interface('Node')],
            fields: () => toGraphQLFieldConfigMap(typeName, '', {
                id: {
                    $type: `Id`,
                    required: true,
                    resolve: async function (root) {
                        return relay.toGlobalId(schema.name, root.id);
                    }
                },
                ...schema.config.fields,
                ...schema.config.links
            }, {
                hookFieldResolve: (name, options) => context.hookFieldResolve(name, options),
                hookQueryResolve: (name, options) => context.hookQueryResolve(name, options),
                hookMutationResolve: (name, options) => context.hookMutationResolve(name, options),
                fieldType: typeName => fieldTypeContext.fieldType(typeName)
            })
        }),
        outputResolve: async function (root, args, context, info, sgContext) {
            const fieldName = info.fieldName;
            if (root[fieldName]) {
                if (typeof root[fieldName] === 'string') {
                    const {
                        type,
                        id
                    } = relay.fromGlobalId(root[fieldName]);
                    if (type === typeName) {
                        return sgContext.models[typeName].findByPkForGraphQL(id, {}, context, info);
                    } else {
                        return sgContext.models[typeName].findByPkForGraphQL(root[fieldName], {}, context, info);
                    }
                } else if (typeof root[fieldName] === 'number') {
                    return sgContext.models[typeName].findByPkForGraphQL(root[fieldName], {}, context, info);
                } else {
                    return root[fieldName];
                }
            } else if (root[fieldName + 'Id']) {
                return sgContext.models[typeName].findByPkForGraphQL(root[fieldName + 'Id'], {}, context, info);
            }
            return null;
        },
        columnOptions: (schema, fieldName, options) => {
            let foreignField = fieldName;
            let onDelete = 'RESTRICT';
            if (options && (<ColumnFieldOptionsType>options).$type && (<ColumnFieldOptionsType>options).columnOptions) {
                if ((<ColumnFieldOptionsType>options).columnOptions.onDelete) {
                    onDelete = (<ColumnFieldOptionsType>options).columnOptions.onDelete;
                }
            }
            if (options && (<ColumnFieldOptionsType>options).$type && (<ColumnFieldOptionsType>options).required) {
                schema.belongsTo({
                    [fieldName]: {
                        target: typeName,
                        hidden: true,
                        foreignField: foreignField,
                        foreignKey: {name: foreignField + 'Id', allowNull: false},
                        onDelete: onDelete,
                        constraints: true
                    }
                });
            } else {
                schema.belongsTo({
                    [fieldName]: {
                        target: typeName,
                        hidden: true,
                        foreignField: foreignField,
                        onDelete: onDelete,
                        constraints: true
                    }
                });
            }
            return null
        }
    };
}

function buildModelTypeId(schema: Schema, fieldTypeContext: FieldTypeContext): FieldType {
    const typeName = schema.name + 'Id';
    const idType = globalIdType(schema.name);
    return {
        name: typeName,
        description: typeName,
        inputType: idType,
        outputType: idType
    };
}

function buildDataType(dataTypeOptions: DataTypeOptions, fieldTypeContext: FieldTypeContext, context: Context): FieldType {
    const toOutputType = (name, $type) => {
        const outputConfigMap = toGraphQLFieldConfigMap(name, '', {'': $type}, {
            hookFieldResolve: (name, options) => context.hookFieldResolve(name, options),
            hookQueryResolve: (name, options) => context.hookQueryResolve(name, options),
            hookMutationResolve: (name, options) => context.hookMutationResolve(name, options),
            fieldType: typeName => fieldTypeContext.fieldType(typeName)
        })[''];
        return outputConfigMap && outputConfigMap.type;
    };

    const toInputType = (name, $type) => {
        const inputConfigMap = toGraphQLInputFieldConfigMap(name, ({'': $type} as any), fieldTypeContext)[''];
        return inputConfigMap && inputConfigMap.type;
    };

    let outputType, inputType;
    if ((<BaseDataTypeOptions>dataTypeOptions).$type) {
        outputType = toOutputType(dataTypeOptions.name, (<BaseDataTypeOptions>dataTypeOptions).$type);
        inputType = toInputType(dataTypeOptions.name, (<BaseDataTypeOptions>dataTypeOptions).$type);
    } else if ((<UnionDataTypeOptions>dataTypeOptions).$unionTypes) {
        const $unionTypes = (<UnionDataTypeOptions>dataTypeOptions).$unionTypes;
        const unionTypes = _.mapValues($unionTypes, (type, key) => (fieldTypeContext.fieldType(`_Union_${type}`) as any).outputType);
        outputType = new GraphQLUnionType({
            name: dataTypeOptions.name,
            types: _.uniq(_.values(unionTypes)),
            resolveType(value) {
                if (value && value.variant) {
                    return (fieldTypeContext.fieldType(`_Union_${$unionTypes[value.variant]}`) as any).outputType;
                }
            }
        });
        inputType = unionInputType({
            name: `${dataTypeOptions.name}Input`,
            inputValueTypes: _.mapValues($unionTypes, ($type, key) => toInputType(`${dataTypeOptions.name}${key}`, $type))
        });
    }
    return {
        name: dataTypeOptions.name,
        description: dataTypeOptions.description || dataTypeOptions.name,
        inputType: inputType,
        outputType: outputType,
        columnOptions: (schema: Schema, fieldName: string, options: ColumnFieldOptions) => {
            let columnOptions: ModelAttributeColumnOptions | null | undefined = null;
            if ((<BaseDataTypeOptions>dataTypeOptions).$type) {
                let typeName = (<BaseDataTypeOptions>dataTypeOptions).$type;
                if (typeName instanceof Set) {
                    columnOptions = {
                        type: Sequelize.STRING(191)
                    };
                } else if (_.isArray(typeName)) {
                    columnOptions = {
                        type: Sequelize.JSON
                    };
                } else if (typeof typeName === 'string') {
                    const fieldType = fieldTypeContext.fieldType(typeName);
                    if (!fieldType) {
                        throw new Error(`Type "${typeName}" has not register.`);
                    }
                    if (!fieldType.columnOptions) {
                        throw new Error(`Column type of "${typeName}" is not supported.`);
                    }
                    columnOptions = typeof fieldType.columnOptions === 'function' ? fieldType.columnOptions(schema, fieldName, options) : fieldType.columnOptions;
                } else {
                    columnOptions = {
                        type: Sequelize.JSON
                    };
                }
            } else {
                columnOptions = {
                    type: Sequelize.JSON
                };
            }
            if (columnOptions) {
                columnOptions = {...columnOptions, ...(dataTypeOptions.columnOptions || {})};
                if ((<ColumnFieldOptionsType>options).$type != null && (<ColumnFieldOptionsType>options).columnOptions != null) {
                    columnOptions = {...columnOptions, ...(((<ColumnFieldOptionsType>options).columnOptions) || {})};
                }
                return columnOptions;
            }
        }
    };
}

function buildUnionWrapType(wrapType: string, fieldTypeContext: FieldTypeContext, context: Context): FieldType {
    const name = `_Union_${wrapType}`;
    const typeConfig = (fieldTypeContext.fieldType(wrapType) as any);
    return {
        name: name,
        description: `Union wrap type for ${wrapType}`,
        inputType: null,
        outputType: new GraphQLObjectType({
            name: name,
            fields: {
                variant: {type: GraphQLString},
                value: {
                    type: typeConfig.outputType,
                    resolve: typeConfig.outputResolve ? context.hookFieldResolve('value', {
                        $type: wrapType,
                        resolve: typeConfig.outputResolve
                    }) : undefined
                }
            }
        }),
        columnOptions: {type: Sequelize.JSON}
    };
}

export default function (fieldTypes: Array<FieldType>, dataTypes: Array<DataTypeOptions>, schemas: Array<Schema>, context: Context) {
    const typeMap = {};

    const resolves = [function resolveFunctionType(typeName) {
        if (typeof typeName !== 'string') {
            switch (typeName) {
                case Date:
                    console.warn('Field type name should be string. Please change Date to \'Date\'.');
                    return typeMap['Date'];
                case String:
                    console.warn('Field type name should be string. Please change String to \'String\'.');
                    return typeMap['String'];
                case Number:
                    console.warn('Field type name should be string. Please change Number to \'Number\'.');
                    return typeMap['Number'];
                case JSON:
                    console.warn('Field type name should be string. Please change JSON to \'JSON\'.');
                    return typeMap['JSON'];
                default:
                    throw new Error(`Unknown type ${typeName}`);

            }
        }
    }, function resolveInterfaceType(typeName) {
        if (typeName.endsWith('Interface')) {
            const gIntf = context.interface(typeName.substr(0, typeName.length - 'Interface'.length));
            if (gIntf) {
                return {
                    name: typeName,
                    outputType: gIntf
                };
            }
        }
    }, function resolveArrayType(typeName) {
        if (typeName.startsWith('[') && typeName.endsWith(']')) {
            const subTypeName = typeName.substr(1, typeName.length - 2);
            const fieldType = fieldTypeContext.fieldType(subTypeName);
            if (!fieldType) {
                return null;
            }
            return {
                name: typeName,
                description: `Array of type ${subTypeName}`,
                inputType: fieldType.inputType ? new GraphQLList(fieldType.inputType) : null,
                outputType: fieldType.outputType ? new GraphQLList(fieldType.outputType) : null,
                outputResolve: async function (root, args, context, info, sgContext) {
                    const fieldName = info.fieldName;
                    if (schemas.find(s => s.name === subTypeName) != null) {
                        if (root[fieldName] != null && root[fieldName].length > 0 && (typeof root[fieldName][0] === 'string' || typeof root[fieldName][0] === 'number')) {
                            const dbModel = sgContext.models[subTypeName];
                            const list = await (dbModel.withCache ? dbModel.withCache : dbModel).findAll({
                                where: {id: {[(Sequelize.Op.in as any)]: root[fieldName]}}
                            });
                            const result = [];
                            for (let id of root[fieldName]) {
                                const element = list.find(e => '' + e.id === '' + id);
                                if (element) {
                                    result.push(element);
                                }
                            }
                            return result;
                        }
                    }
                    return root[fieldName];
                },
                columnOptions: {type: Sequelize.JSON}
            };
        }
    }, function resolveModelType(typeName) {
        let schema = schemas.find(s => s.name === typeName);
        if (schema) {
            return buildModelType(schema, fieldTypeContext, context);
        }
    }, function resolveModelIdType(typeName) {
        let schema = schemas.find(s => s.name + 'Id' === typeName);
        if (schema) {
            return buildModelTypeId(schema, fieldTypeContext);
        }
    }, function resolveModelConnectionType(typeName) {
        let schema = schemas.find(s => s.name + 'Connection' === typeName || s.name + 'Edge' === typeName);
        if (schema) {
            const fieldType = fieldTypeContext.fieldType(schema.name);
            if (!fieldType) {
                return null;
            }
            const connectionInfo = relay.connectionDefinitions({
                name: schema.name,
                nodeType: (fieldType.outputType as any),
                connectionFields: {
                    count: {
                        type: GraphQLFloat
                    }
                }
            });
            typeMap[schema.name + 'Connection'] = {
                name: schema.name + 'Connection',
                description: schema.name + 'Connection',
                argFieldMap: {
                    after: 'String',
                    first: 'Number',
                    before: 'String',
                    last: 'Number'
                },
                inputType: undefined,
                outputType: connectionInfo.connectionType
            };
            typeMap[schema.name + 'Edge'] = {
                name: schema.name + 'Edge',
                description: schema.name + 'Edge',
                inputType: undefined,
                outputType: connectionInfo.edgeType
            };
            return typeMap[typeName];
        }
    }, function resolveUnionWrapType(typeName) {
        if (typeName.startsWith('_Union_')) {
            return buildUnionWrapType(typeName.substr('_Union_'.length), fieldTypeContext, context);
        }
    }];

    const fieldTypeContext: FieldTypeContext = {
        fieldType: typeName => {
            if (typeMap[typeName]) {
                return typeMap[typeName];
            }
            for (let resolve of resolves) {
                const type = resolve(typeName);
                if (type) {
                    typeMap[type.name] = type;
                    return type;
                }
            }
            return null;
        }
    };

    for (let f of [...innerFieldTypes, ...fieldTypes]) {
        typeMap[f.name] = f;
    }

    for (let d of [...innerDataTypes, ...dataTypes]) {
        typeMap[d.name] = buildDataType(d, fieldTypeContext, context);
    }

    return fieldTypeContext;
}
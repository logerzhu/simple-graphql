import {
    coerceValue,
    GraphQLError,
    GraphQLInputObjectType,
    GraphQLInputType,
    GraphQLScalarType,
    GraphQLString,
    isValidLiteralValue,
    ObjectValueNode,
    valueFromAST
} from "graphql";
import _ from "lodash";

const typeKey = 'variant';
const valueKey = 'value';

export default function unionInputType(options: {
    name: string;
    inputValueTypes: {
        [key: string]: GraphQLInputType;
    };
}): GraphQLScalarType {
    return new GraphQLScalarType({
        name: options.name,
        serialize: function (value) {
            return value;
        },
        parseValue: function (inputValue: any) {
            if (inputValue) {
                const type = inputValue[typeKey];
                if (!type) {
                    throw new GraphQLError(`${options.name}(UnionInputType): Missing typeKey ${typeKey} property'`);
                }
                const valueType = options.inputValueTypes[type];
                if (!valueType) {
                    throw new GraphQLError(`${options.name}(UnionInputType): Invalid inputType ${type}'`);
                }
                const {
                    value,
                    errors
                } = coerceValue(inputValue[valueKey], valueType);
                if (!errors) {
                    return {
                        [typeKey]: inputValue[typeKey],
                        [valueKey]: value
                    };
                } else {
                    const errorString = errors.map(error => {
                        return '\n' + error.message;
                    }).join('');
                    throw new GraphQLError(errorString);
                }
            }
        },
        parseLiteral: function (ast) {
            let type;
            try {
                const fields = (((<ObjectValueNode>ast).fields || []) as any);
                for (let i = 0; i < fields.length; i++) {
                    if (_.get(fields[i], 'name.value') === typeKey) {
                        type = _.get(fields[i], 'value.value');
                        break;
                    }
                }
                if (!type) {
                    throw new Error();
                }
            } catch (err) {
                throw new GraphQLError(`${options.name}(UnionInputType): Missing typeKey ${typeKey} property'`);
            }
            const valueType = options.inputValueTypes[type];
            if (!valueType) {
                throw new GraphQLError(`${options.name}(UnionInputType): Invalid inputType ${type}'`);
            }
            const inputType = new GraphQLInputObjectType({
                name: options.name,
                fields: function () {
                    return {
                        [typeKey]: {
                            type: GraphQLString
                        },
                        [valueKey]: {
                            type: valueType
                        }
                    };
                }
            });
            if (isValidLiteralValue(inputType, ast).length === 0) {
                return valueFromAST(ast, inputType);
            } else {
                throw new GraphQLError(`expected ${valueKey} type ${type}, found ${_.get(ast, 'loc.source.body').substring(_.get(ast, 'loc.start'), _.get(ast, 'loc.end'))}`);
            }
        }
    });
}
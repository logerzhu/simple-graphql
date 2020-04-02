
import { GraphQLError, GraphQLScalarType, Kind } from "graphql";
import { fromGlobalId, toGlobalId } from "graphql-relay";

function defGlobalIdInputType(typeName: string): GraphQLScalarType {
  return new GraphQLScalarType({
    name: typeName + 'Id',
    description: 'Global id of ' + typeName,
    serialize(value) {
      if (typeof value === 'string') {
        return toGlobalId(typeName, value);
      } else {
        return value;
      }
    },
    parseValue(value) {
      if (typeof value === 'string') {
        const {
          type,
          id
        } = fromGlobalId(value);
        if (type === typeName) {
          if (Number.parseInt(id).toString() === id) {
            return Number.parseInt(id);
          } else {
            return id;
          }
        }
        throw new Error('Incorrect globalId type: ' + type);
      } else {
        throw new Error('Incorrect globalId format: ');
      }
    },
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) {
        throw new GraphQLError('Query error: Can only parse string to GrobalId but got a: ' + ast.kind, [ast]);
      }
      const value = ast.value;
      if (typeof value === 'string') {
        const {
          type,
          id
        } = fromGlobalId(value);
        if (type === typeName) {
          if (Number.parseInt(id).toString() === id) {
            return Number.parseInt(id);
          } else {
            return id;
          }
        }
        throw new Error('Incorrect globalId type: ' + type);
      } else {
        throw new Error('Incorrect globalId format: ' + value);
      }
    }
  });
}

const types: {
  [id: string]: GraphQLScalarType;
} = {};

export default function globalIdType(typeName: string): GraphQLScalarType {
  if (!types[typeName]) {
    types[typeName] = defGlobalIdInputType(typeName);
  }
  return types[typeName];
}
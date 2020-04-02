
import { FieldType } from "../../Definition";
import Sequelize from "sequelize";
import GraphQLScalarTypes from "./graphql";

export default ({
  name: 'JSON',
  inputType: GraphQLScalarTypes.Json,
  outputType: GraphQLScalarTypes.Json,
  columnOptions: { type: Sequelize.JSON }
} as FieldType);
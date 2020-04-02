
import { FieldType } from "../../Definition";
import Sequelize from "sequelize";
import { GraphQLBoolean } from "graphql";

export default ({
  name: 'Boolean',
  inputType: GraphQLBoolean,
  outputType: GraphQLBoolean,
  columnOptions: { type: Sequelize.BOOLEAN }
} as FieldType);
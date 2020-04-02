
import { FieldType } from "../../Definition";
import { GraphQLID } from "graphql";
import Sequelize from "sequelize";

export default ({
  name: 'Id',
  inputType: GraphQLID,
  outputType: GraphQLID,
  columnOptions: { type: Sequelize.INTEGER }
} as FieldType);
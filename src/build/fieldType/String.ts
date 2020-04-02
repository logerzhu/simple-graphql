import {FieldType} from "../../Definition";
import {GraphQLString} from "graphql";
import Sequelize from "sequelize";

export default ({
    name: 'String',
    inputType: GraphQLString,
    outputType: GraphQLString,
    columnOptions: {type: Sequelize.STRING}
} as FieldType);
import {InterfaceContext, SGContext} from "../Definition";
import {GraphQLInterfaceType} from "graphql";
import {fromGlobalId, nodeDefinitions} from "graphql-relay";

export default ((context: SGContext): InterfaceContext => {
    const interfaces: {
        [key: string]: GraphQLInterfaceType;
    } = {
        Node: nodeDefinitions(globalId => {
            const {
                type,
                id
            } = fromGlobalId(globalId);
            console.log('Warning-------------------- node id Fetcher not implement' + type + ' ' + id);
        }, obj => {
            const type = obj._fieldType;
            const fieldType = context.fieldType(type);
            if (fieldType) {
                return (fieldType.outputType as any);
            }
            throw new Error(`Type ${type} not exist.`);
        }).nodeInterface
    };
    return {
        interface: str => {
            return interfaces[str];
        },
        registerInterface: (name, gInterface) => {
            interfaces[name] = gInterface;
        }
    };
});
import {
    GraphQLFieldResolver,
    GraphQLInputType,
    GraphQLInterfaceType,
    GraphQLOutputType,
    GraphQLResolveInfo
} from "graphql";
import {Model, ModelAttributeColumnOptions, ModelOptions, Sequelize} from "sequelize";
import Schema from "./definition/Schema";

export type ModelDefine = Model;

export type SGContext = {
    sequelize: Sequelize;
    schemas: {
        [key: string]: Schema;
    };
    models: {
        [key: string]: ModelDefine;
    };
    services: {
        [key: string]: Object;
    };
    fieldType: (arg0: string) => FieldType | null | undefined;
};

export type ResolverContext = {
    hookFieldResolve: (arg0: string, arg1: LinkedFieldOptions) => GraphQLFieldResolver<any, any>;
    hookQueryResolve: (arg0: string, arg1: QueryOptions) => GraphQLFieldResolver<any, any>;
    hookMutationResolve: (arg0: string, arg1: MutationOptions) => GraphQLFieldResolver<any, any>;
};

export type InterfaceContext = {
    interface: (arg0: string) => GraphQLInterfaceType;
    registerInterface: (arg0: string, arg1: GraphQLInterfaceType) => void;
};

export type FieldTypeContext = { fieldType: (arg0: string) => FieldType | null | undefined; };

export type FieldResolve = (source: any, args: {
    [key: string]: any;
}, context: any, info: GraphQLResolveInfo, sgContext: SGContext) => any;

export type RootResolve = (args: {
    [key: string]: any;
}, context: any, info: GraphQLResolveInfo, sgContext: SGContext) => any;

export type FieldType = {
    name: string;
    description?: string;
    inputType?: GraphQLInputType | null | undefined;
    argFieldMap?: {
        [key: string]: InputFieldOptions;
    };
    outputType?: GraphQLOutputType | null | undefined;
    outputResolve?: FieldResolve;
    columnOptions?: ModelAttributeColumnOptions | ((schema: Schema, fieldName: string, options: ColumnFieldOptions) => ModelAttributeColumnOptions | null | undefined);
};

export type InputFieldOptions = string | Set<string> | Array<InputFieldOptions> | {
    $type: InputFieldOptions;
    description?: string;
    required: boolean;
    default?: any;
    mapper?: (option: { where: Object; attributes: Array<string>; }, arg1: any) => void;
} | {
    [key: string]: InputFieldOptions;
};

export type FieldOptions = string | Set<string> | Array<FieldOptions> | {
    config?: Object;
    $type: FieldOptions;
    description?: string;
    required: boolean;
    default?: any;
    args?: {
        [key: string]: InputFieldOptions;
    };
    dependentFields?: Array<string>;
    resolve?: FieldResolve;
} | {
    [key: string]: FieldOptions;
};

export type LinkedFieldOptions = {
    config?: Object;
    $type: FieldOptions;
    description?: string;
    required?: boolean;
    dependentFields?: Array<string>;
    args?: {
        [key: string]: InputFieldOptions;
    };
    resolve: FieldResolve;
};

export type ColumnFieldOptions = string | Set<string> | Array<FieldOptions> | {
    config?: Object;
    $type: FieldOptions;
    description?: string;
    required: boolean;
    default?: any;
    hidden?: boolean;
    columnOptions?: ModelAttributeColumnOptions;
    resolve?: FieldResolve;
} | {
    [key: string]: FieldOptions;
};

export type DataTypeOptions = {
    name: string;
    $type: FieldOptions;
    description?: string;
    columnOptions?: ModelAttributeColumnOptions;
} | {
    name: string;
    $unionTypes: {
        [key: string]: string;
    };
    description?: string;
    columnOptions?: ModelAttributeColumnOptions;
};

export type QueryOptions = {
    $type: FieldOptions;
    description?: string;
    config?: Object;
    args?: {
        [key: string]: InputFieldOptions;
    };
    resolve: RootResolve;
};

export type MutationOptions = {
    description?: string;
    config?: Object;
    inputFields: {
        [key: string]: InputFieldOptions;
    };
    outputFields: {
        [key: string]: FieldOptions;
    };
    mutateAndGetPayload: RootResolve;
};

export type SchemaOptionConfig = {
    description?: string;
    plugin?: Object;
    tableOptions?: ModelOptions<any>;
};

export type HookAction = { type: "field" | "query" | "mutation"; name: string; options: LinkedFieldOptions | QueryOptions | MutationOptions; };

export type HookOptions = {
    description?: string;
    priority?: number;
    filter: (action: HookAction) => boolean;
    hook: (action: HookAction, invokeInfo: {
        source: any; args: {
            [key: string]: any;
        } | null | undefined; context: any; info: GraphQLResolveInfo; sgContext: SGContext;
    }, next: () => any) => any;
};

export type PluginOptions = {
    name: string;
    description?: string;
    priority?: number;
    defaultOptions: (boolean | Object) | null | undefined;
    applyToSchema?: (schema: Schema, options: boolean | Object, schemas: Array<Schema>) => void;
    applyToModel?: (model: ModelDefine, options: boolean | Object, models: Array<ModelDefine>) => void;
};

export type BuildOptions = {
    plugin?: {
        [id: string]: boolean | Object;
    };
};
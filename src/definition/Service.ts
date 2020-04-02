import {MutationOptions, QueryOptions} from "../Definition";

export default class Service {

    name: string;

    config: {
        queries: {
            [id: string]: QueryOptions;
        };
        mutations: {
            [id: string]: MutationOptions;
        };
        statics: {
            [id: string]: any;
        };
    };

    constructor(name: string) {
        this.name = name;
        this.config = {
            queries: {},
            mutations: {},
            statics: {}
        };
    }

    /**
     * Add the GraphQL query methods.
     */
    queries(queries: {
        [key: string]: QueryOptions;
    }): Service {
        this.config.queries = Object.assign(this.config.queries, queries);
        return this;
    }

    /**
     * Add the GraphQL mutataion methods.
     */
    mutations(mutations: {
        [key: string]: MutationOptions;
    }): Service {
        this.config.mutations = Object.assign(this.config.mutations, mutations);
        return this;
    }

    /**
     * Add statics method to current Service.
     */
    statics(statics: {
        [key: string]: any;
    }): Service {
        this.config.statics = Object.assign(this.config.statics, statics);
        return this;
    }
}
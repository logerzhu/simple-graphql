/* global $ReadOnlyArray */

import DataLoader from "dataloader";
import {LRUMap} from "lru_map";
import _ from "lodash";
import {FindOptions} from "sequelize";
import getFindOptionsKey from "./getFindOptionsKey";

type MethodKey = { method: string; model: string; includes: Array<string>; };

const cacheKey = (m: MethodKey) => `${m.model}.${m.method}-${m.includes.join(',')}`;

export default class LoaderManager {

    loader: DataLoader<MethodKey, DataLoader<FindOptions, any, string>, string>;

    methodKeyMap: {
        [key: string]: MethodKey;
    };

    constructor(models: Array<any>, loaderLimit: number = 100, resultLimit: number = 100) {
        const self = this;

        self.methodKeyMap = {};
        self.loader = new DataLoader(async function (methodKeys: ReadonlyArray<MethodKey>) {
            const result: any = [];
            for (let methodKey of methodKeys) {
                self.methodKeyMap[cacheKey(methodKey)] = methodKey;
                const dbModel: any = models.find(m => m.name === methodKey.model);
                result.push(new DataLoader(async function (optionses: ReadonlyArray<FindOptions>) {
                    const result2: any = [];
                    for (let options of optionses) {
                        result2.push((await dbModel[methodKey.method](options)));
                    }
                    return result2;
                }, {
                    maxBatchSize: 1,
                    cacheKeyFn: k => getFindOptionsKey(dbModel, k),
                    cacheMap: new LRUMap(resultLimit)
                }));
            }
            return result;
        }, {maxBatchSize: 1, cacheKeyFn: k => cacheKey(k), cacheMap: new LRUMap(loaderLimit)});
    }

    async getMethod(methodKey: MethodKey) {
        const self = this;
        const loader = await self.loader.load(methodKey);
        return async (options: FindOptions) => loader.load(options);
    }

    clear(model: string) {
        const self = this;

        for (let methodKey of _.values(self.methodKeyMap)) {
            if (methodKey.model === model || methodKey.includes.indexOf(model) !== -1) {
                delete self.methodKeyMap[cacheKey(methodKey)];
                self.loader.clear(methodKey);
            }
        }
    }
}
import { CountOptions, FindOptions } from 'sequelize'
import getIncludeModeNames from './getIncludeModeNames'
import getFindOptionsKey from './getFindOptionsKey'
import { SGModelCtrl } from '../../index'

export abstract class SGCacheManager {
  abstract get(key: string): Promise<any>

  abstract set(key: string, value: any, expire?: number): Promise<void>

  /*
  Supported glob-style patterns

  h?llo matches hello, hallo and hxllo
  h*llo matches hllo and heeeello
  h[ae]llo matches hello and hallo, but not hillo
  h[^e]llo matches hallo, hbllo, ... but not hello
  h[a-b]llo matches hallo and hbllo
 */
  abstract del(pattern: string): Promise<number>

  buildCacheKey(
    model: SGModelCtrl,
    method: string,
    options?: FindOptions | CountOptions
  ) {
    options = options || {}
    const relateModelNames = [model.name, ...getIncludeModeNames(options)]
    return `${method}|${relateModelNames.join('|')}|${getFindOptionsKey(
      model,
      options
    )}`
  }
}

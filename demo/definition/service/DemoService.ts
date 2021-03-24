import SG from '../../../src'
import {PluginOptions} from "../../../src/Definition";

let gWeather = '晴天'

declare module '../../../src/Definition' {
  interface SGServiceMap {
    DemoService: PluginOptions & { name?: string }
  }
}

export default SG.service('DemoService').queries({
  weather: {
    output: {type: 'String'},
    resolve: async function (args, context, info) {
      return gWeather
    }
  }
}).mutations({
  setWeather: {
    input: {
      weather: {
        type: 'String',
        nullable: false
      }
    },
    output: {
      weather: {
        type: 'String',
        nullable: false
      }
    },
    mutateAndGetPayload: async function ({
                                           weather
                                         }, context, info) {
      gWeather = weather
      return {
        weather: gWeather
      }
    }
  }
})

// @flow
import SG from '../../../../'

let gWeather = '晴天'

export default SG.service('DemoService').queries({
  weather: {
    $type: String,
    resolve: async function (args, context, info) {
      return gWeather
    }
  }
}).mutations({
  setWeather: {
    inputFields: {
      weather: {
        $type: String,
        required: true
      }
    },
    outputFields: {
      weather: {
        $type: String,
        required: true
      }
    },
    mutateAndGetPayload: async function ({ weather }, context, info) {
      gWeather = weather
      return {
        weather: gWeather
      }
    }
  }
})

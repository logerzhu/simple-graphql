import SG from '../../../src'
import _ from 'lodash'

declare module '../../../src/Definition' {
  interface SGServiceMap {
    DemoService?: DemoService
  }
}

export default class DemoService extends SG.Service {
  gWeather = '晴天'

  getServiceKeys() {
    const sgContext = this.getSGContext()
    return _.keys(sgContext.services)
  }
}

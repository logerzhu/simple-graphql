import Service from '../definition/Service'
import { SGContext } from '../Definition'

export default (services: Array<Service>, sgContext: SGContext): {
    [key: string]: Object;
} => {
  const result = {}
  for (const service of services) {
    if (result[service.name]) {
      throw new Error(`Service ${service.name} already define.`)
    }
    result[service.name] = { ...service.config.statics, getSGContext: () => sgContext }
  }
  return result
}

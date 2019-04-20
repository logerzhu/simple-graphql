// @flow
import Service from '../definition/Service'
import type { SGContext } from '../Definition'

export default (services: Array<Service>, sgContext: SGContext): { [string]: Object } => {
  const result = {}
  for (let service of services) {
    if (result[service.name]) {
      throw new Error(`Service ${service.name} already define.`)
    }
    result[service.name] = { ...service.config.statics, getSGContext: () => sgContext }
  }
  return result
}
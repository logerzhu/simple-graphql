import Service from '../definition/Service'
import { SGContext, SGModel, SGServiceMap } from '../Definition'

export default (
  services: Array<typeof Service & { new (): Service }>,
  sgContext: SGContext
): SGServiceMap => {
  const result = {}
  for (const service of services) {
    if (result[service.name]) {
      throw new Error(`Service ${service.name} already define.`)
    }
    result[service.name] = new service()
    result[service.name].getSGContext = () => sgContext
  }
  return result as SGServiceMap
}

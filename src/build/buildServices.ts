import { SGContext, SGService, SGServiceMap } from '../Definition'

export default (
  services: Array<typeof SGService & { new (): SGService }>,
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

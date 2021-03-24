import { SGContext } from '../Definition'

export default abstract class Service {
  name: string

  getSGContext: () => SGContext
}

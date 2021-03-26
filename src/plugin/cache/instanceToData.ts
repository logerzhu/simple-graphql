import { SGModel } from '../../Definition'

export default function (instance: SGModel | null) {
  if (!instance) {
    return instance
  }
  return instance.get({ plain: true })
}

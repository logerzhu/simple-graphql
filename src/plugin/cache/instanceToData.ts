import { SGModel } from '../../Definition'

export default function (instance: SGModel) {
  if (!instance) {
    return instance
  }
  return instance.get({ plain: true })
}

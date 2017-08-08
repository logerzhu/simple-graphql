// @flow
import SG from '../../../../src/index'

export default SG.schema('User', {
  description: '用户'
}).fields({
  userName: {
    $type: String,
    required: true
  },
  password: {
    $type: String,
    required: true
  },

  blocked: {
    $type: Boolean,
    defaultValue: false
  },
  registerAt: Date
})

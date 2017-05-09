// @flow
import SG from '../../../../src/index'

export default SG.model('User', {
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
  age: SG.ScalarFieldTypes.Int,
  genderAS: {
    $type: String,
    enumValues: ['Male', 'Female']
  },
  blocked: {
    $type: Boolean,
    default: false
  },
  registerAt: Date
}).hasMany({
  target: 'Todo',
  options: {
    as: 'dueTodos',
    foreignKey: 'ownerId',
    scope: {
      completed: false
    }
  }
})

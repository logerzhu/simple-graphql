//@flow
import GS from '../../../../src/index'

const UserDataType = GS.modelRef("UserData")
const UserType = GS.modelRef("User")

type ABC = {loginUser:()=>string}
//

export default GS.model("User", {
  description: "用户",
  addMutation: true
}).fields({
  firstName: String,
  lastName: {
    $type: String,
    description: "姓"
  },
  data: UserDataType
}).links({
  name: {
    $type: {
      $type: [String],
      description: '测试'
    },
    args: {
      a: {
        $type: [String],
        description: '测试'
      },
      b: {
        $type: [{
          c: {
            $type: Number,
          }, d: [Boolean]
        }]
      }
    },
    resolve: async function (source, args, context, info, models) {
      return source.firstName + source.lastName
    }
  }
}).queries({
  getUser: {
    $type: GS.Connection.connectionType(UserType),
    args: {
      ...GS.Connection.args
    },
    resolve: async function (args, context, info, models) {
      return await GS.Connection.resolve(models['User'], {condition: {firstName: 'peng'}})
    }
  }
})
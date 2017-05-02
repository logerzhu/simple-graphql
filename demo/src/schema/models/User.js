//@flow
import GS from '../../../../src'

const UserDataType = GS.modelRef("UserData")
const UserType = GS.modelRef("User")

export default GS.model("User", {
  description: "用户",
  addMutation: false
}).fields({
  firstName: String,
  lastName: {
    $type: String,
    description: "姓"
  },
  data: UserDataType
}).queries({
  getUser: {
    $type: GS.Connection.connectionType(UserType),
    args: {
      ...GS.Connection.args
    },
    resolve: async function(args, info, models) {
      return await GS.Connection.resolve(models['User'], {condition: {firstName: 'peng'}})
    }
  }
}).mutations({
  addUser:{
    inputFields:{
      firstName: String,
      lastName: {
        $type: String,
        description: "姓"
      },
      data: String
    },
    outputFields:{
      userName: String
    },
    mutateAndGetPayload: async function(args, info, models) {
      let userData = await models["UserData"].create({data: "test"})
      return {userName: "test"}
    }
  }
})
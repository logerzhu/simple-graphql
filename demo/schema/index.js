//@flow
import Sequelize from 'sequelize'
import GS from '../../src'

const sequelize = new Sequelize('test1', 'postgres', 'Welcome1', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }
})

let test1:typeof String = String

const User = GS.model("User", {
  description: "用户",
  table:{
    timestamps:true
  }
}).fields({
  firstName: String,

  lastName: {
    $type: String,
    description: "姓",
    required:true
  },
  data: GS.modelRef("UserData")
}).queries({
  allUsers: {
    $type: {user: GS.modelRef("User")},
    args: {
      name: String,
      test: {
        a: Number
      }
    },
    resolve: async function () {
      "use strict";
      return []
    }
  }
})

const UserData = GS.model("UserData", {}).fields({
  owner: GS.modelRef("User"),
  data: {
    $type: String
  }
})
const schema = GS.build(sequelize, [User, UserData], {})

sequelize.sync({
  force: true,
  logging: console.log
}).then(() => console.log("Init DB Done"), (err) => console.log("Init DB Fail", err))

export default schema
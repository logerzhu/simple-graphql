//@flow
import _ from 'lodash'
import Sequelize from 'sequelize'

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

var UserData = sequelize.define('UserData', {
  id: {type: Sequelize.INTEGER, primaryKey: true},
  data: {
    type: Sequelize.JSONB
  }
});

var User = sequelize.define('user', {
  firstName: {
    type: Sequelize.STRING
  },
  lastName: {
    type: Sequelize.STRING
  },
  //dataId: {
  //  type: Sequelize.INTEGER,
  //  references: {
  //    // This is a reference to another model
  //    model: UserData,
  //
  //    // This is the column name of the referenced model
  //    key: 'id'
  //  }
  //}
});


(async function init() {

  User.belongsTo(UserData, {as: 'data'})

  await sequelize.sync({force: true})
  await UserData.create({
    id: 1,
    data: ["A", "B"]
  })

  await User.create({
    firstName: 'John',
    lastName: 'Hancock',
    dataId: 1
  })
  await User.create({
    firstName: 'John2',
    lastName: 'Hancock'
  })

  console.log(( (await User.findAll({
      where: {
        firstName: 'John'
      },
      include: [{model: UserData,as: 'data'}]
    }))[0]).data
  )
})().then(() => {
})
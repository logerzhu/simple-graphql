// @flow
/* eslint-env jest */
import './schema'
import sequelize from './sequelize'
import initData from './data'

beforeAll(async () => {
  await sequelize.sync({
    force: true
  })
  await initData(sequelize)
})

afterAll(() => {
})

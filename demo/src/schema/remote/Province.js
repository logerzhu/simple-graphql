import {commonBinding, toGId, toDbId} from './index'

class Province {
  static getRemoteModelName () {
    return Province.name
  }
  static async findById (id) {
    const province = await commonBinding.query.province({id: toGId(Province.getRemoteModelName(), id)})
    province.id = toDbId(province.id)
    return province
  }

  static async updateById (id, value) {
    const objId = await commonBinding.mutation.updateProvince({
      input: {
        id: toGId(Province.getRemoteModelName(), id),
        value,
        clientMutationId: toGId(Province.getRemoteModelName(), id)
      }
    }, `{ id }`)
    return toDbId(objId)
  }

  static async findAll (condition) {
// todo yy
  }

  static findByIds (ids) {
    let arrIds = [...new Set(ids)]
    let gIds = arrIds.map(id => Province.toGlobalId(id))
  }
}

module.exports = Province

// // @flow
// import SG from 'simple-graphql'
//
// export default SG.model('Province', {
//   description: '省'
// }).fields({
//   name: {
//     $type: String,
//     description: '省名'
//   },
//   code: {
//     $type: String,
//     description: '编码'
//   },
//   activated: {
//     $type: Boolean,
//     default: false,
//     description: '已激活的：只有当该区域创建了诊所时，该区域自动变为可用'
//   }
// }).hasMany({
//   target: 'City',
//   options: {
//     as: 'cities',
//     foreignKey: 'province_id'
//   }
// }).hasMany({
//   target: 'Clinic',
//   options: {
//     as: 'clinics',
//     foreignKey: 'province_id'
//   }
// })

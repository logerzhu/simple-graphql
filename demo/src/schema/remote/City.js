import {commonBinding, toGId, toDbId} from './index'
const REMOTE_MODEL_NAME = 'City'
class City {
  static getRemoteModelName () {
    return City.name
  }
  static async findById (id) {
    const city = await commonBinding.query.city({id: toGId(City.getRemoteModelName(), id)})
    city.id = toDbId(city.id)
    return city
  }

  static async updateById (id, value) {
    const objId = await commonBinding.mutation.updateCity({
      input: {
        id: toGId(City.getRemoteModelName(), id),
        value,
        clientMutationId: toGId(City.getRemoteModelName(), id)
      }
    }, `{ id }`)
    return toDbId(objId)
  }

  static async findAll (condition) {
    // TODO yy
    let result = []
    result = result.map(obj => ({
      ...obj,
      id: toDbId(obj.id)
    }))
    return result
  }

  static toGlobalId (dbId) {
    return toGId(City.getRemoteModelName(), dbId)
  }

  static findByIds (ids) {
    let arrIds = [...new Set(ids)]
    let gIds = arrIds.map(id => City.toGlobalId(id))
  }
}

module.exports = City

// // @flow
// import SG from 'simple-graphql'
//
// const ProvinceType = SG.modelRef('Province')
// const ClinicType = SG.modelRef('Clinic')
//
// export default SG.model('City', {
//   description: '城市'
// }).fields({
//   name: {
//     $type: String,
//     description: '城市名'
//   },
//   code: {
//     $type: String,
//     description: '城市编码'
//   },
//   province: {
//     $type: ProvinceType,
//     required: true,
//     description: '所属省id'
//   },
//   postCode: {
//     $type: String,
//     description: '邮政编码'
//   },
//   activated: {
//     $type: Boolean,
//     default: false,
//     description: '已激活的：只有当该区域创建了诊所时，该区域自动变为可用'
//   }
// }).queries({
//   // clinicCities: {
//   //   description: '获取诊所，根据所在城市去重',
//   //   args: {
//   //     ...SG.Connection.args
//   //   },
//   //   $type: [ClinicType],
//   //   resolve: async function (args, context, info, {Clinic}) {
//   //     const clinics = await Clinic.findAll({
//   //       group: 'city_id',
//   //       where: {archived: false}
//   //     })
//   //     return clinics
//   //   }
//   // }
// }).hasMany({
//   target: 'Clinic',
//   options: {
//     as: 'clinics',
//     foreignKey: 'city_id'
//   }
// }).hasMany({
//   target: 'District',
//   options: {
//     as: 'districts',
//     foreignKey: 'city_id'
//   }
// })

import {commonBinding, toGId, toDbId} from '../remote'
import SG from '../../../../src/index'

const REMOTE_MODEL_NAME = 'City'


export default SG.service(REMOTE_MODEL_NAME).statics({
  getRemoteModelName:() => REMOTE_MODEL_NAME,
  findOne: async (id) => {
    const city = await commonBinding.query.city({id: toGId(City.getRemoteModelName(), id)})
    if(city)
      city.id = toDbId(city.id)
    return city
  },
  findAll: async (condition) => {

  }
})

// class City {
//   static getRemoteModelName () {
//     return City.name
//   }
//   static async findById (id) {
//     const city = await commonBinding.query.city({id: toGId(City.getRemoteModelName(), id)})
//     city.id = toDbId(city.id)
//     return city
//   }
//
//   static async updateById (id, value) {
//     const objId = await commonBinding.mutation.updateCity({
//       input: {
//         id: toGId(City.getRemoteModelName(), id),
//         value,
//         clientMutationId: toGId(City.getRemoteModelName(), id)
//       }
//     }, `{ id }`)
//     return toDbId(objId)
//   }
//
//   static async findAll (condition) {
//     // TODO yy
//     let result = []
//     result = result.map(obj => ({
//       ...obj,
//       id: toDbId(obj.id)
//     }))
//     return result
//   }
//
//   static toGlobalId (dbId) {
//     return toGId(City.getRemoteModelName(), dbId)
//   }
//
//   static findByIds (ids) {
//     let arrIds = [...new Set(ids)]
//     let gIds = arrIds.map(id => City.toGlobalId(id))
//   }
// }


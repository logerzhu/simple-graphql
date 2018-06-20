import SG from '../../../../src/index'

const RemoteCityType = String
const RemoteProvinceType = String

export default SG.schema('Patient', {
    table: {
      hooks: {
        // afterCreate:
        beforeCreate: (patient, options) => {
          patient.pinyinCode = 'fff_create' + patient.pinyinCode
        },
        beforeUpdate: (patient, options) => {
          patient.pinyinCode = 'fff_update' + patient.pinyinCode
        }
      }
    },
    description: '患者信息'
  }).fields({
    realName: {
      $type: String,
      required: true,
      description: '真实姓名'
    },
    gender: {
      $type: SG.ScalarFieldTypes.Int,
      description: '1 男；2 女；3 不详'
    },
    dateOfBirth: {
      $type: Date,
      description: '出生日期'
    },
    age: {
      $type: Number,
      description: '年龄'
    },
    ageRecordedAt: {
      $type: Date,
      description: '年龄记录时间'
    },
    phoneNumber: {
      $type: SG.ScalarFieldTypes.Id,
      description: '手机号'
    },
    province: {
      $type: RemoteProvinceType,
      description: '所在省'
    },
    city: {
      $type: RemoteCityType,
      description: '所在市'
    },
    pinyinCode: {
      $type: String,
      description: '拼音码'
    }
  }).links({
    localCity: {
      $type: RemoteCityType,
      resolve: async function (root, args, context, info, {models:{User},rmtModels:{City}}) {

      }
    }
  }).queries({
    getCitys: {
      description: '获取患者',
      $type: 'UserConnection',
      args: {
        province: RemoteCityType,
        keyword: String,
        sort: [{
          field: String,
          order: {
            $type: String,
            enumValues: ['DESC', 'ASC']
          }
        }]
      },
      resolve: async function (args, context, info) {
        // const {clinicMemberTypeId, keyword} = {...args}
        // let include = []
        // let condition = {}
        // let likeKeyword = ''
        //
        // if (keyword !== undefined && keyword.trim() !== '') {
        //   likeKeyword = '%' + keyword + '%'
        // }
        //
        // if (likeKeyword !== '') {
        //   condition = {$or: [{realName: {$like: likeKeyword}}, {pinyinCode: {$like: likeKeyword}}, {phoneNumber: {$like: likeKeyword}}
        //     // {clinicMemberSerialNo: {$like: likeKeyword}}
        //   ]}
        // }
        //
        // if (clinicMemberTypeId !== undefined) {
        //   include = [{model: MapClinicMemberPatient,
        //     as: 'mapClinicMemberPatients',
        //     where: {
        //       clinic_member_type_id: clinicMemberTypeId
        //     }}]
        // }
        //
        // return SG.Connection.resolve(Patient,
        //   {
        //     ...args,
        //     condition: condition,
        //     include: include
        //   }
        // )
      }
    }
  }).mutations({
    updateMemberData: {
      doc: '更新会员数据',
      inputFields: {
        patientId: String,

      },
      outputFields: {
        changeMember: {
          isIntro: Boolean
        }
      },
      mutateAndGetPayload: async function (args, context, info) {

      }
    }
  })


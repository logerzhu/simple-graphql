import SG from '../../../../src/index'

const RemoteCityType = SG.modelRef('City')
// const RemoteProvinceType = SG.modelRef('Province')

export default SG.schema('Patient', {
  table: {
    hooks: {
      beforeCreate: (patient, options) => {
        patient.pinyinCode = 'fff_create' + patient.pinyinCode
      },
      beforeUpdate: (patient, options) => {
        patient.pinyinCode = 'fff_update' + patient.pinyinCode
      }
    }
  },
  description: '患者信息',
  plugin: {
    addMutation: true,
    singularQuery: true,
    pluralQuery: true
  }
}).fields({
  realName: {
    $type: String,
    hide: true,
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
  // province: {
  //   $type: RemoteProvinceType,
  //   description: '所在省'
  // },
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
    resolve: async function (root, args, context, info, {models:{User}, rmtModels:{City}}) {

    }
  }
}).queries({
  getUser: {
    description: '获取患者',
    $type: 'User',
    args: {
      province: String,
      keyword: String,
      sort: [{
        field: String,
        order: {
          $type: String,
          enumValues: ['DESC', 'ASC']
        }
      }]
    },
    resolve: async function (args, context, info, {models:{User},services:{City}}) {
      console.log('dd',typeof User)
      console.log('dd1',typeof City)
      Object.keys(City).map(key => console.log(key,City[key]))
      let user = await User.findOne({where: {id: '1'}})
      console.log('user',user)
      //console.log(City.findOne)
      City.findOne(2)
      // let city = await City.findOne('2')


      // console.log('city',city)
       // Object.keys(User).map(key => console.log(key,User[key]))
      // Object.keys(City).map(key => console.log(key,User[key]))
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
  },
  getCitysofPats:{
    def:'(patienIds:[String]): [City]',
    resolver:async (args, context, info, {models:{User},services:{City}}) => {


    }
  },
}).mutations({
  updateMemberData: {
    doc: '更新会员数据',
    inputFields: {
      patientId: String
    },
    outputFields: {
      pat: 'Patient'
    },
    mutateAndGetPayload: async function (args, context, info) {

    }
  }
}).remoteLink({
  Query:{
    getCitys:{
      def:'(patienId:String): [City]',
      resolver:async (args, context, info, {models:{User},services:{City}}) => {


      }
    },
    getTest:{
      def:'(id:String): [City]',
      resolver:async (args, context, info, {models:{User},services:{City}}) => {


      }
    }

  },
  Mutation:{

  }
})






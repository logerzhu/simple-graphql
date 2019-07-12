const DataLoader = require('dataloader')

const userLoader = new DataLoader(async (keys) => {
  console.log((keys[0].a))
  console.log(keys)
  return keys.map(k => `New${k}`)
}, { cacheKeyFn: (key) => JSON.stringify(key) })

async function test () {
  userLoader.load({ a: 1 }).then(d => console.log(d))
  userLoader.load({ a: 1 }).then(d => console.log(d))
  // userLoader.load(3).then(d => console.log(d))
  // userLoader.load(1).then(d => console.log(d))
  // await userLoader.load(2)
  // console.log(await userLoader.load(1))
}

test().then(a => {}, e => { console.log(e) })

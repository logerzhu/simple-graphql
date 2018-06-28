/**
 * Created by yuyanq on 2018/6/14.
 */

const EndPoints = {
  common: {
    host: '127.0.0.1',
    port: '4000',
    path: 'graphql'
  }
}

const protocol = 'http'

function endPoint ({host, port, path}) {
  const endPoint = `${protocol}://${host}:${port}/${path}`
  console.log(endPoint)
  return endPoint
}

module.exports = {
  cfg: EndPoints,
  endPoint
}

import https from 'node:https'

import axios from 'axios'

export const createDeviceApiInstance = (baseURL: string) => {
  return axios.create({
    baseURL,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    }),
    insecureHTTPParser: true
  })
}

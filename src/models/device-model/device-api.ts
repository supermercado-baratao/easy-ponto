import https from 'node:https'

import axios, { type AxiosInstance } from 'axios'

export const createDeviceApiInstance = (ip: string): AxiosInstance => {
  const baseURL = `https://${ip}`
  return axios.create({
    baseURL,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    }),
    insecureHTTPParser: true
  })
}

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

export const normalizeUrl = ({
  path,
  session
}: {
  path: string
  session: string
}) => `${path}.fcgi?session=${session}&mode=671`

// @vitest-environment node

import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import { createDeviceApiInstance } from '@/models/device/device-api'
import { deviceModel } from '@/models/device/model'

let session: string = process.env.DEVICE_SESSION_TOKEN!

const api = createDeviceApiInstance(process.env.DEVICE_IP!)

describe('Model Device', () => {
  test('Login to the device', async () => {
    const sessionToken = await deviceModel.login(api, {
      login: process.env.DEVICE_LOGIN as string,
      password: process.env.DEVICE_PASSWORD as string
    })
    expect(sessionToken).toBeTypeOf('string')
    session = sessionToken
  })

  test('Verifying if the session is valid', async () => {
    const sessionIsValid = await deviceModel.sessionIsValid(api, session)
    expect(sessionIsValid).toBe(true)
  })

  test('Counting users', async () => {
    const count = await deviceModel.countUsers(api, session)
    expect(count).toBeTypeOf('number')
  })

  test('Loading users', async () => {
    const users = await deviceModel.loadUsers(api, session)
    for (const user of users) {
      expect(user.name).toBeTypeOf('string')
      expect(user.pis).toBeTypeOf('number')
      expect(user.code).toBeTypeOf('number')
      expect(user.templates_count).toBeTypeOf('number')
      expect(user.password).toBeTypeOf('string')
      expect(user.admin).toBeTypeOf('boolean')
      expect(user.rfid).toBeTypeOf('number')
      expect(user.bars).toBeTypeOf('string')
      expect(user.registration).toBeTypeOf('number')
      expect(Object.keys(user).length).toBe(9)
    }
  })

  test('Exporting users', async () => {
    const data = await deviceModel.exportUsers(api, session)
    expect(data).toBeTypeOf('string')
  })

  test('Loading company', async () => {
    const data = await deviceModel.loadCompany(api, session)
    expect(data.name).toBeTypeOf('string')
    expect(data.address).toBeTypeOf('string')
    expect(data.cpf).toBeTypeOf('number')
    expect(data.tipo_doc).toBeTypeOf('number')
    expect(data.cpf_cnpj).toBeTypeOf('number')
    expect(data.cei).toBeTypeOf('number')
    expect(Object.keys(data)).toHaveLength(6)
  })

  test('Getting system information', async () => {
    const data = await deviceModel.getSystemInformation(api, session)
    expect(data.user_count).toBeTypeOf('number')
    expect(data.template_count).toBeTypeOf('number')
    expect(data.uptime).toBeTypeOf('number')
    expect(data.ticks).toBeTypeOf('number')
    expect(data.cuts).toBeTypeOf('number')
    expect(data.coil_paper).toBeTypeOf('number')
    expect(data.total_paper).toBeTypeOf('number')
    expect(data.paper_ok).toBeTypeOf('boolean')
    expect(data.low_paper).toBeDefined()
    expect(data.memory).toBeTypeOf('number')
    expect(data.used_mrp).toBeTypeOf('number')
    expect(data.last_nsr).toBeTypeOf('number')
    expect(Object.keys(data)).toHaveLength(12)
  })

  test('Getting about REP', async () => {
    const data = await deviceModel.getAboutRep(api, session)
    expect(data.mac).toBeTypeOf('string')
    expect(data.nSerie).toBeTypeOf('string')
    expect(data.versionFW).toBeTypeOf('number')
    expect(data.versionMRP).toBeTypeOf('number')
    expect(Object.keys(data)).toHaveLength(4)
  })

  test('Getting ID cloud status', async () => {
    const data = await deviceModel.getIdCloudStatus(api, session)
    expect(data.enable).toBeTypeOf('boolean')
    expect(data.interval).toBeTypeOf('number')
    expect(Object.keys(data)).toHaveLength(2)
  })

  test('Getting system datetime', async () => {
    const data = await deviceModel.getSystemDatetime(api, session)
    expect(data.day).toBe(dayjs().date())
    expect(data.month).toBe(dayjs().month() + 1)
    expect(data.year).toBe(dayjs().year())
    expect(data.hour).toBe(dayjs().hour())
    expect(data.minute).toBeTypeOf('number')
    expect(data.second).toBeTypeOf('number')
    expect(Object.keys(data)).toHaveLength(6)
  })

  test('Getting AFD', async () => {
    const data = await deviceModel.getAfd(api, { session })
    expect(data).toBeTypeOf('string')
  })

  test('Getting public key', async () => {
    const data = await deviceModel.getPublicKey(api, session)
    expect(data.base32).toBeTypeOf('string')
    expect(data.base64).toBeTypeOf('string')
    expect(Object.keys(data)).toHaveLength(2)
  })

  test('Getting system network information', async () => {
    const data = await deviceModel.getSystemNetworkInformation(api, session)
    expect(data.ip).toBeTypeOf('string')
    expect(data.netmask).toBeTypeOf('string')
    expect(data.gateway).toBeTypeOf('string')
    expect(data.dns).toBeTypeOf('string')
    expect(Object.keys(data)).toHaveLength(4)
  })

  test('Getting coil paper', async () => {
    const data = await deviceModel.getCoilPaper(api, session)
    expect(data).toBeTypeOf('number')
  })

  test('Getting system daylight saving time', async () => {
    const data = await deviceModel.getSystemDaylightSavingTime(api, session)
    expect(data.start_date_time.year).toBeTypeOf('number')
    expect(data.start_date_time.month).toBeTypeOf('number')
    expect(data.start_date_time.day).toBeTypeOf('number')
    expect(data.end_date_time.year).toBeTypeOf('number')
    expect(data.end_date_time.month).toBeTypeOf('number')
    expect(data.end_date_time.day).toBeTypeOf('number')
    expect(Object.keys(data)).toHaveLength(2)
  })

  test('Getting users info', async () => {
    const data = await deviceModel.getUsersInfo(api, session)
    expect(data.num_serie).toBeTypeOf('string')
    expect(data.user_count).toBeTypeOf('number')
    expect(data.administrator_count).toBeTypeOf('number')
    expect(data.template_count).toBeTypeOf('number')
    expect(data.password_count).toBeTypeOf('number')
    expect(data.bars_count).toBeTypeOf('number')
    expect(data.rfid_count).toBeTypeOf('number')
    expect(data.uptime).toBeTypeOf('number')
    expect(data.low_on_paper).toBeTypeOf('boolean')
    expect(data.cuts).toBeTypeOf('number')
    expect(data.total_printed).toBeTypeOf('number')
    expect(Object.keys(data)).toHaveLength(11)
  })

  test('Getting system configuration', async () => {
    const data = await deviceModel.getSystemConfig(api, session)
    expect(data.beep_enabled).toBeTypeOf('boolean')
    expect(data.animation_enabled).toBeTypeOf('boolean')
    expect(data.economic_receipt_enabled).toBeTypeOf('boolean')
    expect(data.one_to_one_enabled).toBeTypeOf('boolean')
    expect(Object.keys(data)).toHaveLength(4)
  })
})

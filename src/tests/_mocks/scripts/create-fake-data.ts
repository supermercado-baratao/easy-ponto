import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import { faker } from '@faker-js/faker'
import ora from 'ora'

import { PIS_LENGTH } from '@/constants/length'
import { createDeviceApiInstance } from '@/models/device/device-api'
import { deviceModel } from '@/models/device/model'
import { parseAfd } from '@/models/synchronization/_utils/afd'
import { normalizeLeftZeros } from '@/models/synchronization/_utils/normalize'
import { execAsync } from '@/tests/_utils/exec-async'

process.loadEnvFile('.env.local')

const api = createDeviceApiInstance(process.env.DEVICE_IP as string)

const basePath = path.join(import.meta.dirname, '..')

const saveTextFile = async (name: string, data: string): Promise<void> => {
  await writeFile(`${basePath}/${name}.txt`, data)
}

const saveFile = async (file: string, data: any): Promise<void> => {
  await writeFile(`${basePath}/${file}`, data)
}

const spinner = ora('Acessando o relógio de ponto').start()

try {
  const session = await deviceModel.login(api, {
    login: process.env.DEVICE_LOGIN as string,
    password: process.env.DEVICE_PASSWORD as string
  })

  const date = new Date()

  const day = 1
  const month = date.getMonth() - 1 // two months before
  const year = date.getFullYear()

  spinner.text = 'Buscando dados no relógio de ponto'

  const [deviceAfd, deviceUsers] = await Promise.all([
    deviceModel.getAfd(api, {
      session,
      initialDate: {
        day,
        month,
        year: month === 1 ? year - 1 : year
      }
    }),
    deviceModel.loadUsers(api, session)
  ])

  spinner.text = 'Gerando dados falsos'

  let afd = deviceAfd
    .split('\n')
    .filter((line) => line.length === 39)
    .join('\n')

  const users = deviceUsers.map((user) => {
    const fakePis = faker.string.numeric({
      length: PIS_LENGTH
    })

    const fakeName = faker.person.fullName()
    afd = afd
      .replaceAll(normalizeLeftZeros(user.pis, PIS_LENGTH), () => fakePis)
      .replaceAll(user.name, () => fakeName)

    return {
      ...user,
      pis: Number(fakePis),
      name: fakeName
    }
  })

  const parsedAfd = parseAfd(afd).filter((record) =>
    users.some(
      (user) => normalizeLeftZeros(user.pis, PIS_LENGTH) === record.pis
    )
  )

  spinner.text = 'Salvando dados'

  await saveTextFile('afd', afd)
  await saveFile(
    'device-users.ts',
    `
    import { TDeviceUser } from '@/models/device/types'

    export const deviceUsers: TDeviceUser[] = ${JSON.stringify(users, null, 2)}
  `
  )
  await saveFile(
    'parsed-afd.ts',
    `
    import { TParsedAfdRecord } from '@/models/synchronization/types'

    export const parsedAfd: TParsedAfdRecord[] = ${JSON.stringify(parsedAfd, null, 2)}
  `
  )

  spinner.text = 'Formatando arquivos'

  await execAsync('pnpm exec eslint --fix src/tests/_mocks')
  await execAsync('pnpm prettier:fix src/tests/_mocks')

  spinner.succeed('Dados gerados com sucesso')
} catch (error) {
  spinner.fail('Erro ao gerar dados')
  console.error(error)
}

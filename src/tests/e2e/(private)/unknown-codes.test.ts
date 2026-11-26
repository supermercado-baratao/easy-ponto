import { faker } from '@faker-js/faker'
import { expect, test } from '@playwright/test'

import { OWNER_ROLE } from '@/models/account/utils'
import { companyModel } from '@/models/company/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import { SIGNED_OUT_STORAGE_STATE } from '@/tests/_utils/e2e-auth'
import {
  createDayRow,
  createEmployee,
  createReportFile,
  createReportRows
} from '@/tests/_utils/secullum-report'
import orchestrator from '@/tests/orchestrator'

test.use({ storageState: SIGNED_OUT_STORAGE_STATE })

const owner = {
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: faker.internet.password({ length: 12 })
}

const [employee] = deviceUsers

const WHOLE_DAY_LUTO = {
  'Ent. 1': 'LUTO',
  'Saí. 1': 'LUTO',
  'Ent. 2': 'LUTO',
  'Saí. 2': 'LUTO'
}

const createLutoFile = (): File => {
  const reportEmployee = createEmployee({
    name: employee.name,
    totals: {},
    days: [createDayRow('06/10/25 - seg', WHOLE_DAY_LUTO)]
  })
  return createReportFile(createReportRows({ employees: [reportEmployee] }))
}

test.beforeAll(async () => {
  // Another company, so the initial balance doesn't close a period of the mocked one
  const { id: companyId } = await companyModel.create(
    orchestrator.createCompanyData()
  )
  await userModel.createMany(mapDeviceUserToUser([employee], companyId))
  await orchestrator.createMember({ ...owner, companyId, role: OWNER_ROLE })
})

test.describe('Unknown codes', () => {
  test('Registers a new type for an unknown code and imports with it', async ({
    page
  }) => {
    await page.goto('/entrar')
    const panel = page.getByRole('tabpanel')
    await panel.getByRole('textbox', { name: 'E-mail' }).fill(owner.email)
    await panel.getByLabel('Senha', { exact: true }).fill(owner.password)
    await panel.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).not.toHaveURL('/entrar')
    await page.goto('/relatorio-de-horas')
    const file = createLutoFile()

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Importar saldo inicial' }).click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: file.name,
      mimeType: file.type,
      buffer: Buffer.from(await file.arrayBuffer())
    })
    const dialog = page.getByRole('dialog', {
      name: 'Códigos de justificativa desconhecidos'
    })
    await dialog.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Cadastrar um novo tipo' }).click()
    const typeDialog = page.getByRole('dialog', { name: 'Cadastrar tipo' })
    await expect(typeDialog.getByRole('textbox', { name: 'Nome' })).toHaveValue(
      'LUTO'
    )
    await typeDialog.getByRole('textbox', { name: 'Nome' }).fill('Luto')
    await typeDialog.getByRole('combobox', { name: 'Efeito' }).click()
    await page.getByRole('option', { name: 'Abona' }).click()
    await typeDialog.getByRole('button', { name: 'Salvar' }).click()

    await expect(typeDialog).toBeHidden()
    await expect(dialog.getByRole('combobox', { name: 'Tipo' })).toContainText(
      'Luto'
    )
    await dialog.getByRole('button', { name: 'Importar' }).click()
    await expect(
      page.getByText('Saldo inicial importado com sucesso!')
    ).toBeVisible()
  })
})

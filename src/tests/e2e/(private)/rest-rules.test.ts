import { faker } from '@faker-js/faker'
import { expect, test } from '@playwright/test'

import { OWNER_ROLE } from '@/models/account/utils'
import { companyModel } from '@/models/company/model'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { shiftPatternModel } from '@/models/shift-pattern/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import { SIGNED_OUT_STORAGE_STATE } from '@/tests/_utils/e2e-auth'
import orchestrator from '@/tests/orchestrator'

test.use({ storageState: SIGNED_OUT_STORAGE_STATE })

const owner = {
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: faker.internet.password({ length: 12 })
}

const [employee] = deviceUsers

const PATTERN_NAME = 'Seis por um'

test.beforeAll(async () => {
  // Another company, so the generated rests never reach the calendar and the pending items of the mocked one
  const { id: companyId } = await companyModel.create(
    orchestrator.createCompanyData()
  )
  await userModel.createMany(mapDeviceUserToUser([employee], companyId))
  const [{ id: userId }] = await userModel.findManyByCompanyId(companyId)
  const { id: shiftPatternId } = await shiftPatternModel.create({
    companyId,
    name: PATTERN_NAME,
    startDate: '2027-01-01',
    cycleLength: '7',
    ...Object.fromEntries(
      [1, 2, 3, 4, 5, 6].flatMap((day) => [
        [`day${day}Entry1`, '08:00'],
        [`day${day}Exit1`, '16:00']
      ])
    )
  })
  // The cycle starts on Monday, March 1, 2027, so the days off are the Sundays
  await shiftAssignmentModel.create({
    companyId,
    userId,
    shiftPatternId,
    startDate: '2027-03-01',
    endDate: '',
    cycleStartDay: '1'
  })
  await orchestrator.createMember({ ...owner, companyId, role: OWNER_ROLE })
})

test.describe('Rest rules', () => {
  test('Registers a rule, previews and saves the rests of a month and removes the rule', async ({
    page
  }) => {
    await page.goto('/entrar')
    const panel = page.getByRole('tabpanel')
    await panel.getByRole('textbox', { name: 'E-mail' }).fill(owner.email)
    await panel.getByLabel('Senha', { exact: true }).fill(owner.password)
    await panel.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).not.toHaveURL('/entrar')

    await page.goto('/regras-de-folga')
    await expect(
      page.getByText('Nenhuma regra de folga cadastrada')
    ).toBeVisible()

    await page.getByRole('button', { name: 'Cadastrar regra de folga' }).click()
    const sheet = page.getByRole('dialog', {
      name: 'Cadastrar regra de folga'
    })
    await sheet.getByLabel('Nome').fill('Folga entre os dias 10 e 25')
    await sheet.getByRole('checkbox', { name: PATTERN_NAME }).check()
    await sheet.getByLabel('Primeiro dia').fill('10')
    await sheet.getByLabel('Último dia').fill('5')
    await sheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      sheet.getByText('O último dia deve ser depois do primeiro')
    ).toBeVisible()
    await expect(sheet.getByLabel('Nome')).toHaveValue(
      'Folga entre os dias 10 e 25'
    )

    await sheet.getByLabel('Último dia').fill('25')
    await sheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(sheet).toBeHidden()
    await expect(
      page
        .getByRole('table', { name: 'Regras de folga' })
        .getByRole('row', { name: /Folga entre os dias 10 e 25/ })
        .locator('th, td')
    ).toHaveText([
      'Folga entre os dias 10 e 25',
      PATTERN_NAME,
      'Dia 10 a 25',
      '2, 4, 6, 1',
      'Só conta dentro da janela',
      'Nenhuma',
      ''
    ])

    await page.getByRole('button', { name: 'Gerar folgas' }).click()
    const dialog = page.getByRole('dialog', { name: 'Gerar folgas' })
    await dialog.getByLabel('Mês').fill('2027-03')
    await dialog.getByRole('button', { name: 'Ver prévia' }).click()
    const preview = dialog.getByRole('table', { name: 'Prévia das folgas' })
    await expect(preview.locator('tbody tr')).toHaveCount(2)
    await expect(
      preview.locator('tbody tr').first().locator('th, td')
    ).toHaveText([employee.name, 'dom, 07/03', 'qui, 11/03', ''])
    await expect(
      preview.locator('tbody tr').last().locator('th, td')
    ).toHaveText([employee.name, 'dom, 28/03', 'qua, 24/03', ''])

    await dialog.getByRole('button', { name: 'Salvar folgas' }).click()
    await expect(page.getByText('2 folgas movidas com sucesso!')).toBeVisible()
    await expect(dialog).toBeHidden()

    await page
      .getByRole('button', { name: 'Remover Folga entre os dias 10 e 25' })
      .click()
    await page
      .getByRole('alertdialog', { name: 'Remover regra de folga?' })
      .getByRole('button', { name: 'Remover' })
      .click()
    await expect(
      page.getByText('Nenhuma regra de folga cadastrada')
    ).toBeVisible()
  })
})

import { faker } from '@faker-js/faker'
import { expect, test } from '@playwright/test'

import { VIEWER_ROLE } from '@/models/account/utils'
import { companyModel } from '@/models/company/model'
import { restRuleModel } from '@/models/rest-rule/model'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { shiftPatternModel } from '@/models/shift-pattern/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import { SIGNED_OUT_STORAGE_STATE } from '@/tests/_utils/e2e-auth'
import orchestrator from '@/tests/orchestrator'

test.use({ storageState: SIGNED_OUT_STORAGE_STATE })

const viewer = {
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: faker.internet.password({ length: 12 })
}

const [employee] = deviceUsers

const PATTERN_NAME = 'Seis por um'

const RULE_NAME = 'Folga entre os dias 10 e 25'

let companyId: string

test.beforeAll(async () => {
  // Another company, so the rests of the rule never reach the pages of the mocked one
  ;({ id: companyId } = await companyModel.create(
    orchestrator.createCompanyData()
  ))
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
  await restRuleModel.create({
    companyId,
    name: RULE_NAME,
    shiftPatternIds: [shiftPatternId],
    windowStartDay: '10',
    windowEndDay: '25',
    distances: '2, 4, 6, 1',
    holidayRest: 'window',
    blockedWeekdays: []
  })
  await orchestrator.createMember({ ...viewer, companyId, role: VIEWER_ROLE })
})

test.describe('Schedule report', () => {
  test('Shows the rests of the period as the rules plan them and the summary for the management', async ({
    page
  }) => {
    await page.goto('/entrar')
    const panel = page.getByRole('tabpanel')
    await panel.getByRole('textbox', { name: 'E-mail' }).fill(viewer.email)
    await panel.getByLabel('Senha', { exact: true }).fill(viewer.password)
    await panel.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).not.toHaveURL('/entrar')

    await page.goto('/relatorio-da-escala?de=2027-03&ate=2027-03')
    await expect(page.getByText(/As folgas de março de 2027/)).toBeVisible()
    await expect(
      page.getByRole('definition').filter({ hasText: /^qui, 11\/03$/ })
    ).toBeVisible()
    await expect(
      page
        .getByRole('table', { name: 'Funcionários' })
        .getByRole('row', { name: new RegExp(employee.name) })
        .locator('th, td')
    ).toHaveText([
      employee.name,
      '—',
      PATTERN_NAME,
      'Domingo',
      '4',
      '2',
      '1',
      '1',
      '0',
      '00:00'
    ])

    await restRuleModel.generate({ companyId, month: '2027-03' })
    await page.reload()
    await expect(
      page.getByRole('table', { name: 'Funcionários' })
    ).toBeVisible()
    await expect(page.getByText('Pontos de atenção')).toBeHidden()

    await page.getByRole('link', { name: 'Gerência' }).click()
    await expect(page).toHaveURL(/versao=gerencia/)
    await expect(page.getByRole('heading', { name: RULE_NAME })).toBeVisible()
    await expect(
      page
        .getByRole('table', { name: 'Escalas' })
        .getByRole('row', { name: new RegExp(PATTERN_NAME) })
        .locator('th, td')
    ).toHaveText([PATTERN_NAME, '1'])
  })
})

import { expect, test } from '@playwright/test'

import type { User } from '@/infra/database/types'
import { userModel } from '@/models/user/model'
import { vacationPlanModel } from '@/models/vacation-plan/model'
import orchestrator from '@/tests/orchestrator'

const PERIOD = { inicio: '2025-10-01', fim: '2025-10-31' }

let user: User

test.beforeAll(async () => {
  const companyId = await orchestrator.findMockedCompanyId()
  const users = await userModel.findManyByCompanyId(companyId)
  user = users[4]
})

test.describe.configure({ mode: 'serial' })

test.describe('Justifications', () => {
  test('Adds, edits and removes the justification types', async ({ page }) => {
    await page.goto('/tipos-de-justificativa')
    const table = page.getByRole('table', { name: 'Tipos de justificativa' })
    await expect(table.locator('tbody tr th > span:first-child')).toHaveText([
      'Abono',
      'Atestado médico',
      'Ausência legal',
      'Compensação',
      'Férias',
      'Licença'
    ])

    for (const { name, effect } of [
      { name: 'Declaração', effect: 'Abona' },
      { name: 'Folga', effect: 'Desconta do banco de horas' }
    ]) {
      await page.getByRole('button', { name: 'Cadastrar tipo' }).click()
      const sheet = page.getByRole('dialog', { name: 'Cadastrar tipo' })
      await sheet.getByLabel('Nome').fill(name)
      await sheet.getByRole('combobox', { name: 'Efeito' }).click()
      await page.getByRole('option', { name: effect }).click()
      await sheet.getByRole('button', { name: 'Salvar' }).click()
      await expect(sheet).toBeHidden()
    }

    await page.getByRole('button', { name: 'Cadastrar tipo' }).click()
    const createSheet = page.getByRole('dialog', { name: 'Cadastrar tipo' })
    await createSheet.getByLabel('Nome').fill('FOLGA')
    await createSheet.getByRole('combobox', { name: 'Efeito' }).click()
    await page.getByRole('option', { name: 'Abona' }).click()
    await createSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      createSheet.getByText('Já existe um tipo com esse nome')
    ).toBeVisible()
    await expect(createSheet.getByLabel('Nome')).toBeFocused()
    await createSheet.getByRole('button', { name: 'Cancelar' }).click()

    await page
      .getByRole('button', { name: 'Editar Declaração', exact: true })
      .click()
    const editSheet = page.getByRole('dialog', { name: 'Editar tipo' })
    await editSheet.getByLabel('Nome').fill('Declaração de horas')
    await editSheet
      .getByLabel('Descrição')
      .fill('Horas na Justiça como testemunha.')
    await editSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(editSheet).toBeHidden()
    await expect(
      table.getByRole('row', { name: 'Declaração de horas' }).locator('th, td')
    ).toHaveText([
      'Declaração de horasHoras na Justiça como testemunha.',
      'Abona',
      ''
    ])

    await page.getByRole('button', { name: 'Remover Folga' }).click()
    const dialog = page.getByRole('alertdialog', {
      name: 'Remover tipo de justificativa?'
    })
    await dialog.getByRole('button', { name: 'Remover' }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText('Tipo de justificativa removido com sucesso!')
    ).toBeVisible()
    await expect(table.locator('tbody tr')).toHaveCount(7)
  })

  test('Justifies, edits and removes the absence of a day', async ({
    page
  }) => {
    await page.goto(
      `/registros-de-ponto?${new URLSearchParams({ pis: user.pis, ...PERIOD })}`
    )
    const table = page.getByRole('table', { name: 'Registros de ponto' })
    const getJustificationCell = (date: string) =>
      table.getByRole('row').filter({ hasText: date }).getByRole('cell').nth(-2)

    await page.getByRole('button', { name: 'Ações de 06/10/2025' }).click()
    await page.getByRole('menuitem', { name: 'Justificar' }).click()
    const createSheet = page.getByRole('dialog', {
      name: 'Justificar ausência'
    })
    await expect(createSheet.getByLabel('Data inicial')).toHaveValue(
      '2025-10-06'
    )
    await createSheet.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Declaração de horas' }).click()
    await createSheet.getByLabel('Data final').fill('2025-10-08')
    await createSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(createSheet).toBeHidden()
    await expect(
      page.getByRole('button', { name: 'Ações de 06/10/2025' })
    ).toBeFocused()
    for (const date of ['06/10/2025', '07/10/2025', '08/10/2025']) {
      await expect(getJustificationCell(date)).toHaveAccessibleName(
        'Declaração de horas, 06/10/2025 a 08/10/2025'
      )
    }
    await expect(getJustificationCell('09/10/2025')).toHaveText('')

    await page.getByRole('button', { name: 'Ações de 08/10/2025' }).click()
    await page.getByRole('menuitem', { name: 'Justificar' }).click()
    await createSheet.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Declaração de horas' }).click()
    await createSheet.getByLabel('Horário de início').fill('14:00')
    await createSheet.getByLabel('Horário de fim').fill('15:40')
    await createSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      createSheet.getByText(
        'Já existe uma justificativa nesse período: Declaração de horas (06/10/2025)'
      )
    ).toBeVisible()
    await expect(createSheet.getByLabel('Horário de fim')).toHaveValue('15:40')
    await createSheet.getByRole('button', { name: 'Cancelar' }).click()

    await page.getByRole('button', { name: 'Ações de 07/10/2025' }).click()
    await page
      .getByRole('menuitem', { name: 'Editar Declaração de horas' })
      .click()
    const editSheet = page.getByRole('dialog', {
      name: 'Editar justificativa'
    })
    await editSheet.getByLabel('Data final').fill('2025-10-06')
    await editSheet.getByLabel('Horário de início').fill('14:00')
    await editSheet.getByLabel('Horário de fim').fill('15:40')
    await editSheet.getByLabel('Observação').fill('Testemunha em audiência')
    await editSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(editSheet).toBeHidden()
    const label =
      'Declaração de horas, 06/10/2025, 14:00–15:40, Testemunha em audiência'
    await expect(getJustificationCell('06/10/2025')).toHaveAccessibleName(label)
    await expect(
      getJustificationCell('06/10/2025').getByTitle(label)
    ).toHaveText('Declaração de horas 14:00–15:40')
    await expect(getJustificationCell('07/10/2025')).toHaveText('')

    await page.goto('/tipos-de-justificativa')
    await page
      .getByRole('button', { name: 'Remover Declaração de horas', exact: true })
      .click()
    await page
      .getByRole('alertdialog', { name: 'Remover tipo de justificativa?' })
      .getByRole('button', { name: 'Remover' })
      .click()
    await expect(
      page.getByText(
        'O tipo Declaração de horas está em uso em justificativas.'
      )
    ).toBeVisible()
    await page.goBack()

    await page.getByRole('button', { name: 'Ações de 06/10/2025' }).click()
    await page
      .getByRole('menuitem', {
        name: 'Remover Declaração de horas 14:00–15:40'
      })
      .click()
    const dialog = page.getByRole('alertdialog', {
      name: 'Remover justificativa?'
    })
    await dialog.getByRole('button', { name: 'Remover' }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText('Justificativa removida com sucesso!')
    ).toBeVisible()
    await expect(getJustificationCell('06/10/2025')).toHaveText('')
  })

  test('Registers a planned vacation as a justification', async ({ page }) => {
    await vacationPlanModel.save({
      companyId: user.companyId,
      userId: user.id,
      year: 2030,
      month: '7'
    })
    await page.goto('/ferias?ano=2030')
    const row = page
      .getByRole('table', { name: 'Planejamento das férias de 2030' })
      .getByRole('row', { name: user.name })

    await row
      .getByRole('button', { name: `Registrar as férias de ${user.name}` })
      .click()
    const sheet = page.getByRole('dialog', { name: 'Registrar férias' })
    await expect(sheet.getByLabel('Data inicial')).toHaveValue('2030-07-01')
    await expect(sheet.getByLabel('Data final')).toHaveValue('2030-07-31')
    await sheet.getByRole('combobox', { name: 'Tipo de justificativa' }).click()
    await page.getByRole('option', { name: 'Declaração de horas' }).click()
    await sheet.getByLabel('Data inicial').fill('2030-07-08')
    await sheet.getByRole('button', { name: 'Registrar' }).click()
    await expect(sheet).toBeHidden()
    await expect(row.getByRole('cell').nth(2)).toHaveText(
      'Registradas (Declaração de horas): 08/07/2030 a 31/07/2030'
    )
    await expect(
      row.getByRole('button', { name: `Registrar as férias de ${user.name}` })
    ).toBeHidden()

    await expect(
      page.getByRole('button', { name: `Planejar as férias de ${user.name}` })
    ).toBeFocused()

    await page
      .getByRole('button', { name: `Planejar as férias de ${user.name}` })
      .click()
    const planSheet = page.getByRole('dialog', { name: 'Planejar férias' })
    await expect(planSheet).toContainText(
      'Remova a justificativa nos registros de ponto para mudar o mês.'
    )
    await expect(
      planSheet.getByRole('combobox', { name: 'Mês' })
    ).toBeDisabled()
    await planSheet.getByRole('button', { name: 'Cancelar' }).click()

    await page.goto(
      `/registros-de-ponto?${new URLSearchParams({ pis: user.pis, inicio: '2030-07-01', fim: '2030-07-31' })}`
    )
    await expect(
      page
        .getByRole('table', { name: 'Registros de ponto' })
        .getByRole('row')
        .filter({ hasText: '08/07/2030' })
        .getByRole('cell')
        .nth(-2)
    ).toHaveAccessibleName('Declaração de horas, 08/07/2030 a 31/07/2030')
  })
})

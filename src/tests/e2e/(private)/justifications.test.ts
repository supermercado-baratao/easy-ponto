import { expect, test } from '@playwright/test'

import type { User } from '@/infra/database/types'
import { adminUserModel } from '@/models/admin-user/model'
import { userModel } from '@/models/user/model'

const PERIOD = { inicio: '2025-10-01', fim: '2025-10-31' }

let user: User

test.beforeAll(async () => {
  const adminUser = await adminUserModel.findUniqueById(
    process.env.ADMIN_USER_ID!
  )
  const users = await userModel.findManyByCompanyId(adminUser.companyId!)
  user = users[4]
})

test.describe.configure({ mode: 'serial' })

test.describe('Justifications', () => {
  test('Adds, edits and removes the justification types', async ({ page }) => {
    await page.goto('/tipos-de-justificativa')
    await expect(
      page.getByText('Nenhum tipo de justificativa cadastrado')
    ).toBeVisible()

    for (const { code, description, effect } of [
      { code: 'ATEST', description: 'Atestado', effect: 'Abona' },
      {
        code: 'FOLGA',
        description: 'Folga',
        effect: 'Desconta do banco de horas'
      }
    ]) {
      await page.getByRole('button', { name: 'Cadastrar tipo' }).click()
      const sheet = page.getByRole('dialog', { name: 'Cadastrar tipo' })
      await sheet.getByLabel('Código').fill(code)
      await sheet.getByLabel('Descrição').fill(description)
      await sheet.getByRole('combobox', { name: 'Efeito' }).click()
      await page.getByRole('option', { name: effect }).click()
      await sheet.getByRole('button', { name: 'Salvar' }).click()
      await expect(sheet).toBeHidden()
    }

    await page.getByRole('button', { name: 'Cadastrar tipo' }).click()
    const createSheet = page.getByRole('dialog', { name: 'Cadastrar tipo' })
    await createSheet.getByLabel('Código').fill('FOLGA')
    await createSheet.getByLabel('Descrição').fill('Outra folga')
    await createSheet.getByRole('combobox', { name: 'Efeito' }).click()
    await page.getByRole('option', { name: 'Abona' }).click()
    await createSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      createSheet.getByText('Já existe um tipo com esse código')
    ).toBeVisible()
    await expect(createSheet.getByLabel('Código')).toBeFocused()
    await createSheet.getByRole('button', { name: 'Cancelar' }).click()

    const table = page.getByRole('table', { name: 'Tipos de justificativa' })
    await page.getByRole('button', { name: 'Editar ATEST' }).click()
    const editSheet = page.getByRole('dialog', { name: 'Editar tipo' })
    await editSheet.getByLabel('Descrição').fill('Atestado médico')
    await editSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(editSheet).toBeHidden()
    await expect(table.locator('tbody tr').nth(0).locator('th, td')).toHaveText(
      ['ATEST', 'Atestado médico', 'Abona', '']
    )

    await page.getByRole('button', { name: 'Remover FOLGA' }).click()
    const dialog = page.getByRole('alertdialog', {
      name: 'Remover tipo de justificativa?'
    })
    await dialog.getByRole('button', { name: 'Remover' }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText('Tipo de justificativa removido com sucesso!')
    ).toBeVisible()
    await expect(table.locator('tbody tr')).toHaveCount(1)
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
    await page.getByRole('option', { name: 'ATEST – Atestado médico' }).click()
    await createSheet.getByLabel('Data final').fill('2025-10-08')
    await createSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(createSheet).toBeHidden()
    await expect(
      page.getByRole('button', { name: 'Ações de 06/10/2025' })
    ).toBeFocused()
    for (const date of ['06/10/2025', '07/10/2025', '08/10/2025']) {
      await expect(getJustificationCell(date)).toHaveAccessibleName(
        'ATEST – Atestado médico, 06/10/2025 a 08/10/2025'
      )
    }
    await expect(getJustificationCell('09/10/2025')).toHaveText('')

    await page.getByRole('button', { name: 'Ações de 08/10/2025' }).click()
    await page.getByRole('menuitem', { name: 'Justificar' }).click()
    await createSheet.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'ATEST – Atestado médico' }).click()
    await createSheet.getByLabel('Horário de início').fill('14:00')
    await createSheet.getByLabel('Horário de fim').fill('15:40')
    await createSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      createSheet.getByText(
        'Já existe uma justificativa nesse período: ATEST (06/10/2025)'
      )
    ).toBeVisible()
    await expect(createSheet.getByLabel('Horário de fim')).toHaveValue('15:40')
    await createSheet.getByRole('button', { name: 'Cancelar' }).click()

    await page.getByRole('button', { name: 'Ações de 07/10/2025' }).click()
    await page.getByRole('menuitem', { name: 'Editar ATEST' }).click()
    const editSheet = page.getByRole('dialog', {
      name: 'Editar justificativa'
    })
    await editSheet.getByLabel('Data final').fill('2025-10-06')
    await editSheet.getByLabel('Horário de início').fill('14:00')
    await editSheet.getByLabel('Horário de fim').fill('15:40')
    await editSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(editSheet).toBeHidden()
    await expect(getJustificationCell('06/10/2025')).toHaveAccessibleName(
      'ATEST – Atestado médico, 06/10/2025, 14:00–15:40'
    )
    await expect(getJustificationCell('07/10/2025')).toHaveText('')

    await page.goto('/tipos-de-justificativa')
    await page.getByRole('button', { name: 'Remover ATEST' }).click()
    await page
      .getByRole('alertdialog', { name: 'Remover tipo de justificativa?' })
      .getByRole('button', { name: 'Remover' })
      .click()
    await expect(
      page.getByText('O tipo ATEST está em uso em justificativas.')
    ).toBeVisible()
    await page.goBack()

    await page.getByRole('button', { name: 'Ações de 06/10/2025' }).click()
    await page
      .getByRole('menuitem', { name: 'Remover ATEST 14:00–15:40' })
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
})

import { expect, test } from '@playwright/test'

import orchestrator from '@/tests/orchestrator'

test.beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

test.describe('Status Page', () => {
  test('Retrieving current system status', async ({ page }) => {
    await page.goto('/status')

    const heading = page.getByRole('heading', {
      name: 'Status do Sistema',
      level: 1
    })
    await expect(heading).toBeVisible()

    const timestamp = page.locator('p').filter({ hasText: 'Atualizado em' })
    await expect(timestamp).toBeVisible()

    const databaseHeading = page.getByRole('heading', {
      name: 'Banco de Dados',
      level: 2
    })

    const databaseSection = databaseHeading.locator('..')

    const [versionItem, maxConnectionsItem, openedConnectionsItem] =
      await databaseSection.locator('li').all()

    expect(await versionItem.first().textContent()).toBe('Versão16.0')

    expect(await maxConnectionsItem.first().textContent()).toBe(
      'Conexões Máximas100'
    )

    expect(await openedConnectionsItem.first().textContent()).toContain(
      'Conexões Abertas'
    )

    const progressBar = page.locator('[role="progressbar"]')

    await expect(progressBar).toBeVisible()
    await expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    await expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })
})

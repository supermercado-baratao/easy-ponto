import { describe, expect, test } from 'vitest'

import { getDescendantIds, getGroupLabel, sortGroupsByPath } from './utils'

const groups = [
  { id: 'cashier', name: 'Caixa', parentId: null },
  { id: 'replenishment', name: 'Reposição', parentId: null },
  { id: 'cereals', name: 'Cereais', parentId: 'replenishment' },
  { id: 'cleaning', name: 'Limpeza', parentId: 'replenishment' },
  { id: 'detergents', name: 'Detergentes', parentId: 'cleaning' }
]

describe('getDescendantIds', () => {
  test('Returns every group inside the given one, at any depth', () => {
    expect(getDescendantIds(groups, 'replenishment')).toEqual(
      new Set(['cereals', 'cleaning', 'detergents'])
    )
  })

  test('Returns nothing for a group without groups inside it', () => {
    expect(getDescendantIds(groups, 'cashier').size).toBe(0)
  })

  test('Stops on a cycle saved by mistake', () => {
    const cycle = [
      { id: 'a', name: 'A', parentId: 'b' },
      { id: 'b', name: 'B', parentId: 'a' }
    ]
    expect(getDescendantIds(cycle, 'a')).toEqual(new Set(['b', 'a']))
  })
})

describe('getGroupLabel', () => {
  test('Joins the names from the top group down to the given one', () => {
    expect(getGroupLabel(groups, 'detergents')).toBe(
      'Reposição › Limpeza › Detergentes'
    )
  })

  test('Shows only the name of a top group', () => {
    expect(getGroupLabel(groups, 'cashier')).toBe('Caixa')
  })
})

describe('sortGroupsByPath', () => {
  test('Places each group right after the group above it', () => {
    expect(sortGroupsByPath(groups).map(({ id }) => id)).toEqual([
      'cashier',
      'replenishment',
      'cereals',
      'cleaning',
      'detergents'
    ])
  })
})

import type { UserGroup } from '@/infra/database/types'

type TGroupNode = Pick<UserGroup, 'id' | 'name' | 'parentId'>

export const GROUP_PATH_SEPARATOR = ' › '

export const isSameGroupName = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase()

export const getDescendantIds = (
  groups: TGroupNode[],
  id: string
): Set<string> => {
  const descendants = new Set<string>()
  const pending = [id]
  while (pending.length > 0) {
    const parentId = pending.pop()
    for (const group of groups) {
      if (group.parentId !== parentId || descendants.has(group.id)) {
        continue
      }

      descendants.add(group.id)
      pending.push(group.id)
    }
  }
  return descendants
}

export const getGroupPath = (groups: TGroupNode[], id: string): string[] => {
  const byId = new Map(groups.map((group) => [group.id, group]))
  const path: string[] = []
  const visited = new Set<string>()
  let group = byId.get(id)
  while (group && !visited.has(group.id)) {
    visited.add(group.id)
    path.unshift(group.name)
    group = group.parentId ? byId.get(group.parentId) : undefined
  }
  return path
}

export const getGroupLabel = (groups: TGroupNode[], id: string): string =>
  getGroupPath(groups, id).join(GROUP_PATH_SEPARATOR)

export const sortGroupsByPath = <T extends TGroupNode>(groups: T[]): T[] =>
  groups.toSorted((a, b) =>
    getGroupLabel(groups, a.id).localeCompare(
      getGroupLabel(groups, b.id),
      'pt-BR'
    )
  )

export const findGroupByName = <T extends TGroupNode>(
  groups: T[],
  name: string
): T | undefined => groups.find((group) => isSameGroupName(group.name, name))

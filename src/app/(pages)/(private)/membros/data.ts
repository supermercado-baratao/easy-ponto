import { requireEditor } from '@/entry/session'
import { memberModel } from '@/models/member/model'
import type { TMember, TMemberActor } from '@/models/member/types'

type TMembersPageData = {
  members: TMember[]
  actor: TMemberActor
}

export const getMembersPageData = async (): Promise<TMembersPageData> => {
  const { user, role, company } = await requireEditor()
  const members = await memberModel.findManyByCompanyId(company.id)
  return { members, actor: { userId: user.id, role } }
}

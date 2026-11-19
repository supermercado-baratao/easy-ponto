import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import type { TMember, TMemberActor } from '@/models/member/types'

import { AddMemberSheet } from './add-member-sheet/add-member-sheet'
import { MemberActionsProvider } from './member-actions/member-actions-provider'
import { MembersTable } from './members-table'

export const MainContent = ({
  members,
  actor
}: {
  members: TMember[]
  actor: TMemberActor
}) => (
  <>
    <Header title="Membros">
      <AddMemberSheet actorRole={actor.role} />
    </Header>
    <_MainContent className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        As pessoas que acessam os dados da empresa. Os funcionários entram com o
        CPF e são geridos em Funcionários.
      </p>
      <MemberActionsProvider>
        <MembersTable members={members} actor={actor} />
      </MemberActionsProvider>
    </_MainContent>
  </>
)

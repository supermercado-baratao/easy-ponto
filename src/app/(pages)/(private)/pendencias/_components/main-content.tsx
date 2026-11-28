import { CircleCheck } from 'lucide-react'

import { Header } from '@/app/components/blocks/header'
import { PageMessage } from '@/app/components/blocks/page-message'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/app/components/ui/shadcn/tabs'
import type { TPendingItems } from '@/models/pending-item/types'

import { PendingItemGroups } from './pending-item-groups'

export const MainContent = ({
  open,
  dismissed,
  limits,
  canEdit
}: TPendingItems & { canEdit: boolean }) => (
  <>
    <Header title="Pendências" />
    <_MainContent>
      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open" id="open-tab">
            Abertas ({open.length})
          </TabsTrigger>
          <TabsTrigger value="dismissed" id="dismissed-tab">
            Dispensadas ({dismissed.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="flex flex-col gap-4 pt-4">
          {open.length > 0 ? (
            <PendingItemGroups
              items={open}
              limits={limits}
              canEdit={canEdit}
              idPrefix="open"
            />
          ) : (
            <PageMessage
              icon={CircleCheck}
              title="Nenhuma pendência"
              titleAs="h2"
              description="Tudo dentro do padrão por enquanto."
            />
          )}
        </TabsContent>
        <TabsContent value="dismissed" className="flex flex-col gap-4 pt-4">
          {dismissed.length > 0 ? (
            <PendingItemGroups
              items={dismissed}
              limits={limits}
              canEdit={canEdit}
              idPrefix="dismissed"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma pendência dispensada
            </p>
          )}
        </TabsContent>
      </Tabs>
    </_MainContent>
  </>
)

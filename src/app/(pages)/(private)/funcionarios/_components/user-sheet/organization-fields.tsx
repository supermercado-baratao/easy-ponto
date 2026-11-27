'use client'

import { useId, useState } from 'react'

import { Checkbox } from '@/app/components/ui/shadcn/checkbox'
import {
  FieldDescription,
  FieldLegend,
  FieldSet
} from '@/app/components/ui/shadcn/field'
import { Label } from '@/app/components/ui/shadcn/label'
import type { JobFunction, UserGroup } from '@/infra/database/types'
import type { TUserJobFunctionLink } from '@/models/job-function/utils'
import { getGroupLabel, sortGroupsByPath } from '@/models/user-group/utils'

const toggle = (list: string[], id: string, checked: boolean): string[] =>
  checked ? [...list, id] : list.filter((item) => item !== id)

// Controlled, since the refresh after a save hands new defaults to the same checkboxes
export const GroupsField = ({
  groups,
  defaultValue
}: {
  groups: UserGroup[]
  defaultValue: string[]
}) => {
  const [checkedIds, setCheckedIds] = useState(defaultValue)

  return (
    <FieldSet>
      <FieldLegend variant="label">Grupos</FieldLegend>
      {groups.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sortGroupsByPath(groups).map((group) => (
            <Label key={group.id} className="font-normal">
              <Checkbox
                name="groupIds[]"
                value={group.id}
                checked={checkedIds.includes(group.id)}
                onCheckedChange={(checked) =>
                  setCheckedIds((current) => toggle(current, group.id, checked))
                }
              />
              {getGroupLabel(groups, group.id)}
            </Label>
          ))}
        </div>
      ) : (
        <FieldDescription>Nenhum grupo cadastrado em Grupos.</FieldDescription>
      )}
    </FieldSet>
  )
}

export const JobFunctionsField = ({
  jobFunctions,
  defaultValue
}: {
  jobFunctions: JobFunction[]
  defaultValue: TUserJobFunctionLink[]
}) => {
  const descriptionId = useId()
  const [assignedIds, setAssignedIds] = useState(() =>
    defaultValue.map(({ jobFunctionId }) => jobFunctionId)
  )
  // A function given now starts active, the usual case
  const [inactiveIds, setInactiveIds] = useState(() =>
    defaultValue
      .filter(({ active }) => !active)
      .map(({ jobFunctionId }) => jobFunctionId)
  )

  return (
    <FieldSet aria-describedby={descriptionId}>
      <FieldLegend variant="label">Outras funções</FieldLegend>
      <FieldDescription id={descriptionId}>
        As funções que o funcionário exerce além do cargo na folha. Desmarque
        &quot;Ativa&quot; quando ele deixa de exercê-la, sem perder o registro.
      </FieldDescription>
      {jobFunctions.length > 0 ? (
        <div className="flex flex-col gap-3">
          {jobFunctions.map((jobFunction) => {
            const isAssigned = assignedIds.includes(jobFunction.id)
            return (
              <div
                key={jobFunction.id}
                className="flex items-center justify-between gap-4"
              >
                <Label className="font-normal">
                  <Checkbox
                    name="jobFunctionIds[]"
                    value={jobFunction.id}
                    checked={isAssigned}
                    onCheckedChange={(checked) =>
                      setAssignedIds((current) =>
                        toggle(current, jobFunction.id, checked)
                      )
                    }
                  />
                  <span>
                    {jobFunction.name}{' '}
                    <span className="text-muted-foreground">
                      (nível {jobFunction.level})
                    </span>
                  </span>
                </Label>
                <Label className="font-normal">
                  <Checkbox
                    name="activeJobFunctionIds[]"
                    value={jobFunction.id}
                    disabled={!isAssigned}
                    checked={!inactiveIds.includes(jobFunction.id)}
                    onCheckedChange={(checked) =>
                      setInactiveIds((current) =>
                        toggle(current, jobFunction.id, !checked)
                      )
                    }
                    aria-label={`${jobFunction.name} ativa`}
                  />
                  <span aria-hidden="true">Ativa</span>
                </Label>
              </div>
            )
          })}
        </div>
      ) : (
        <FieldDescription>
          Nenhuma função cadastrada em Funções.
        </FieldDescription>
      )}
    </FieldSet>
  )
}

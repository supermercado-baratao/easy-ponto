'use client'

import { CalendarRange, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/app/components/ui/shadcn/alert-dialog'
import { Button } from '@/app/components/ui/shadcn/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/app/components/ui/shadcn/sheet'
import { showActionError } from '@/app/utils/action-error'
import type {
  ShiftAssignment,
  TShiftPatternWithVersions
} from '@/infra/database/types'

import { remove } from './actions'
import { ShiftAssignmentForm } from './shift-assignment-form'
import type { TRemoveState, TShiftAssignmentFormValues } from './types'
import { formatAssignmentPeriod } from './utils'

const RemoveAssignmentButton = ({
  id,
  description,
  focusAfterRemovalId
}: {
  id: string
  description: string
  focusAfterRemovalId: string
}) => {
  const [open, setOpen] = useState(false)
  const removedReference = useRef(false)
  const initialState: TRemoveState = {}
  // The item unmounts with the refresh that comes with the result, so the toast can't wait for an effect
  // and the focus can't return to the trigger
  const [, formAction, pending] = useActionState(
    async (
      previousState: TRemoveState,
      formData: FormData
    ): Promise<TRemoveState> => {
      const result = await remove(previousState, formData)
      removedReference.current = !!result.success
      if (result.success) {
        toast.success('Escala removida do funcionário com sucesso!')
        setOpen(false)
      } else {
        showActionError(result)
        if (result.message) setOpen(false)
      }
      return result
    },
    initialState
  )

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remover a escala ${description}`}
          />
        }
      >
        <Trash2 aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent
        finalFocus={() =>
          removedReference.current
            ? document.querySelector<HTMLElement>(
                `[id="${CSS.escape(focusAfterRemovalId)}"]`
              )
            : true
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Remover a escala do funcionário?</AlertDialogTitle>
          <AlertDialogDescription>
            {`O período em que o funcionário seguiu a escala ${description} sai do histórico, junto com os ajustes de dia ligados a ela. Para registrar a saída da escala, informe o fim em vez de remover.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={id} />
            <Button
              type="submit"
              variant="destructive"
              disabled={pending}
              focusableWhenDisabled
              className="w-full"
            >
              {pending ? <Loader mode="inline" label="Remover" /> : 'Remover'}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const getTitle = (editing: TShiftAssignmentFormValues | null): string => {
  if (!editing) return 'Escalas do funcionário'
  return editing.id ? 'Editar escala do funcionário' : 'Ligar a uma escala'
}

const toFormValues = (
  userId: string,
  assignment?: ShiftAssignment
): TShiftAssignmentFormValues =>
  assignment
    ? {
        id: assignment.id,
        userId,
        shiftPatternId: assignment.shiftPatternId,
        startDate: assignment.startDate,
        endDate: assignment.endDate ?? '',
        cycleStartDay: String(assignment.cycleStartDay)
      }
    : { userId }

export const ShiftAssignmentsSheet = ({
  userId,
  name,
  assignments,
  shiftPatterns,
  today
}: {
  userId: string
  name: string
  assignments: ShiftAssignment[]
  shiftPatterns: TShiftPatternWithVersions[]
  today: string
}) => {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TShiftAssignmentFormValues | null>(
    null
  )
  const returnFocusIdReference = useRef<string | null>(null)
  const id = useId()
  const createButtonId = `${id}-create`
  const getEditButtonId = (assignmentId: string): string =>
    `${id}-edit-${assignmentId}`
  const namesById = new Map(shiftPatterns.map(({ id, name }) => [id, name]))

  // The list takes the place of the form in the same sheet, so the focus goes back to the button that opened it
  useEffect(() => {
    const returnFocusId = returnFocusIdReference.current
    if (editing || !returnFocusId) return
    returnFocusIdReference.current = null
    document
      .querySelector<HTMLElement>(`[id="${CSS.escape(returnFocusId)}"]`)
      ?.focus()
  }, [editing])

  const openForm = (
    values: TShiftAssignmentFormValues,
    openerId: string
  ): void => {
    returnFocusIdReference.current = openerId
    setEditing(values)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        if (open) return
        setEditing(null)
        returnFocusIdReference.current = null
      }}
    >
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Escalas de ${name}`}
          />
        }
      >
        <CalendarRange aria-hidden="true" />
      </SheetTrigger>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{getTitle(editing)}</SheetTitle>
          <SheetDescription>{name}</SheetDescription>
        </SheetHeader>
        {editing ? (
          <ShiftAssignmentForm
            shiftPatterns={shiftPatterns}
            defaultValues={editing}
            today={today}
            onDone={() => setEditing(null)}
          />
        ) : (
          <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
            {assignments.length > 0 ? (
              <ul
                aria-label="Histórico de escalas"
                className="flex flex-col divide-y"
              >
                {assignments.map((assignment) => {
                  const shiftPatternName = namesById.get(
                    assignment.shiftPatternId
                  )!
                  const period = formatAssignmentPeriod(assignment)
                  // The same pattern may come back in the history, so the period tells the links apart
                  const description = `${shiftPatternName} (${period})`
                  return (
                    <li
                      key={assignment.id}
                      className="flex items-center justify-between gap-2 py-3"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{shiftPatternName}</span>
                        <span className="text-sm text-muted-foreground">
                          {`${period}, a partir do dia ${assignment.cycleStartDay} do ciclo`}
                        </span>
                      </div>
                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          id={getEditButtonId(assignment.id)}
                          aria-label={`Editar a escala ${description}`}
                          onClick={() =>
                            openForm(
                              toFormValues(userId, assignment),
                              getEditButtonId(assignment.id)
                            )
                          }
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <RemoveAssignmentButton
                          id={assignment.id}
                          description={description}
                          focusAfterRemovalId={createButtonId}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma escala ligada a este funcionário
              </p>
            )}
            {shiftPatterns.length > 0 ? (
              <Button
                id={createButtonId}
                variant="outline"
                className="self-start"
                onClick={() => openForm(toFormValues(userId), createButtonId)}
              >
                Ligar a uma escala
              </Button>
            ) : (
              <p className="text-sm">
                Cadastre as escalas da empresa em{' '}
                <Link href="/escalas" className="underline underline-offset-4">
                  Escalas
                </Link>
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

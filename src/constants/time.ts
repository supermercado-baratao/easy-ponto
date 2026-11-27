export const WEEKDAYS = [
  { key: 'monday', weekday: 1 },
  { key: 'tuesday', weekday: 2 },
  { key: 'wednesday', weekday: 3 },
  { key: 'thursday', weekday: 4 },
  { key: 'friday', weekday: 5 },
  { key: 'saturday', weekday: 6 },
  { key: 'sunday', weekday: 0 }
] as const

export type TWeekdayKey = (typeof WEEKDAYS)[number]['key']

export const TIME_PAIRS = [
  { entry: 'entry1', exit: 'exit1' },
  { entry: 'entry2', exit: 'exit2' },
  { entry: 'entry3', exit: 'exit3' }
] as const

export type TTimeField = (typeof TIME_PAIRS)[number]['entry' | 'exit']

export const TIME_FIELDS: TTimeField[] = TIME_PAIRS.flatMap(
  ({ entry, exit }) => [entry, exit]
)

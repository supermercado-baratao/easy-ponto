import { dayjs } from '@/lib/dayjs'

export const isValidDate = (date: string): boolean => {
  return dayjs(date).isValid()
}

export const ddMMYYYYToDate = (date: string): Date => {
  const [day, month, year] = date.split('/')
  return dayjs(`${year}-${Number(month) - 1}-${day}`).toDate()
}

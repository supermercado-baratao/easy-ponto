import { dayjs } from '@/lib'

export const isValidDate = (date: string): boolean => {
  return dayjs(date).isValid()
}

import { z } from 'zod'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export const timeSchema = z
  .string()
  .refine((value) => value === '' || TIME_PATTERN.test(value), {
    message: 'Horário deve estar no formato hh:mm'
  })
  .default('')

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export const minutesToTime = (minutes: number): string => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  return `${hours}:${String(minutes % 60).padStart(2, '0')}`
}

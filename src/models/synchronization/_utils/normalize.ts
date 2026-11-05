import { CNPJ_LENGTH, CPF_LENGTH } from '@/constants/length'

export const normalizeLeftZeros = (
  number: number | string,
  length: number
): string => number.toString().padStart(length, '0')

export const normalizePis = (pis: string): string =>
  pis.length === 12 && pis.startsWith('0') ? pis.slice(1, -1) : pis

export const normalizeCnpj = (cnpj: string): string =>
  normalizeLeftZeros(cnpj.replaceAll(/\D/g, ''), CNPJ_LENGTH)

export const normalizeCpf = (cpf: string): string =>
  normalizeLeftZeros(cpf.replaceAll(/\D/g, ''), CPF_LENGTH)

export const normalizeLeftZeros = (
  number: number | string,
  length: number
): string => {
  const str = number.toString()
  const strLength = str.length
  if (length <= strLength) return str
  return '0'.repeat(length - strLength) + str
}

export const normalizePis = (pis: string): string => {
  if (pis.length === 12 && pis.startsWith('0')) {
    return pis.slice(1, -1)
  }
  return pis
}

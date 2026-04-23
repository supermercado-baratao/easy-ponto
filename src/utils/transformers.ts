export const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = Object.fromEntries(
    Object.entries(obj as object).filter(([key]) => !keys.includes(key as K))
  )
  return result as Omit<T, K>
}

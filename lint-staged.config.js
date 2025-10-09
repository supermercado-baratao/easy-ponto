import path from 'node:path'
import { fileURLToPath } from 'node:url'

const buildCommand = (stagedFiles) => {
  const files = stagedFiles
    .map((f) => path.relative(path.dirname(fileURLToPath(import.meta.url)), f))
    .join(' ')
  return [`pnpm prettier:fix ${files}`, `pnpm eslint:fix ${files}`]
}

export default {
  '*': [buildCommand]
}

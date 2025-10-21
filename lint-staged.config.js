import path from 'node:path'
import { fileURLToPath } from 'node:url'

const executeCommand = (stagedFiles, command) => {
  const files = stagedFiles
    .map((f) => path.relative(path.dirname(fileURLToPath(import.meta.url)), f))
    .join(' ')
  return [`${command} ${files}`]
}

export default {
  '*.{js,mjs,ts,tsx}': (stagedFiles) =>
    executeCommand(stagedFiles, 'pnpm eslint:fix'),
  '*.{js,mjs,ts,json,yaml,md}': (stagedFiles) =>
    executeCommand(stagedFiles, 'pnpm prettier:fix')
}

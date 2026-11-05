export const normalizeUrl = ({
  path,
  session
}: {
  path: string
  session: string
}): string => `${path}.fcgi?session=${session}&mode=671`

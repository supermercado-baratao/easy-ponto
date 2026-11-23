export const NOT_FOUND_TITLE = 'Página não encontrada'

export const NOT_FOUND_DESCRIPTION =
  'O endereço pode estar errado ou a página pode ter sido removida.'

export const ERROR_TITLE = 'Algo deu errado'

// The digest is the only reference to the server log that production sends to the browser
export const getErrorDescription = (error: unknown): string => {
  const digest =
    error instanceof Error && 'digest' in error ? String(error.digest) : null
  const description =
    'Não foi possível carregar esta página. Tente novamente em instantes.'
  return digest
    ? `${description} Se o erro continuar, informe ao suporte o código ${digest}.`
    : description
}

import { MainContent } from './_components/main-content'
import { getUsersPageData } from './data'

// Remove this line when authentication is implemented and the ADMIN_USER_ID environment variable is removed.
export const dynamic = 'force-dynamic'

const getFirstValue = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value)

const Users = async ({ searchParams }: PageProps<'/funcionarios'>) => {
  const { nome, cargo, situacao } = await searchParams
  const data = await getUsersPageData({
    name: getFirstValue(nome),
    position: getFirstValue(cargo),
    status: getFirstValue(situacao)
  })
  return <MainContent {...data} />
}

export default Users

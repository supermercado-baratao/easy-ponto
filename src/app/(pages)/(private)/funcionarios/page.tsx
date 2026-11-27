import { MainContent } from './_components/main-content'
import { getUsersPageData } from './data'

const getFirstValue = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value)

const Users = async ({ searchParams }: PageProps<'/funcionarios'>) => {
  const { nome, cargo, situacao, grupo, funcao } = await searchParams
  const data = await getUsersPageData({
    name: getFirstValue(nome),
    position: getFirstValue(cargo),
    status: getFirstValue(situacao),
    group: getFirstValue(grupo),
    jobFunction: getFirstValue(funcao)
  })
  return <MainContent {...data} />
}

export default Users

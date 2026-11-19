import { MainContent } from './_components/main-content'
import { getPunchRecordsPageData } from './data'

const getFirstValue = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value)

const PunchRecords = async ({
  searchParams
}: PageProps<'/registros-de-ponto'>) => {
  const { pis, inicio, fim } = await searchParams
  const data = await getPunchRecordsPageData({
    pis: getFirstValue(pis),
    initialDate: getFirstValue(inicio),
    finalDate: getFirstValue(fim)
  })
  return <MainContent {...data} />
}

export default PunchRecords

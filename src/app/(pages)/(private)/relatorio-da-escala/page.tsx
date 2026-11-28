import { MainContent } from './_components/main-content'
import { getScheduleReportPageData } from './data'

const getFirstValue = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value)

const ScheduleReport = async ({
  searchParams
}: PageProps<'/relatorio-da-escala'>) => {
  const { de, ate, limite, versao } = await searchParams
  const data = await getScheduleReportPageData({
    initialMonth: getFirstValue(de),
    finalMonth: getFirstValue(ate),
    limit: getFirstValue(limite),
    version: getFirstValue(versao)
  })
  return <MainContent {...data} />
}

export default ScheduleReport

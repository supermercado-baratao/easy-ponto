import { userModel } from '@/models'

type TInfoProps = {
  pis: string
}

const Info = async ({ pis }: TInfoProps) => {
  const user = await userModel.findUniqueByPisWithPunchRecords(pis)

  return <pre>{JSON.stringify(user, null, 2)}</pre>
}

export default Info

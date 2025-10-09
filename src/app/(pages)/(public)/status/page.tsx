import status from '@/server/models/status'

const Status = async () => {
  const info = await status.check()
  return <pre>{JSON.stringify(info, null, 2)}</pre>
}

export default Status

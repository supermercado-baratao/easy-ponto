import { Header, MainContent } from '@/app/components'
import { deviceCredentialsModel, userModel } from '@/models'

import { DeviceForm } from './_components'

const Settings = async () => {
  const user = await userModel.findUniqueById(process.env.USER_ID!)
  const deviceCredentials = await deviceCredentialsModel.findUniqueByUserId(
    user.id
  )
  return (
    <>
      <Header title="Configurações" />
      <MainContent className="p-4">
        <DeviceForm userId={user.id} deviceCredentials={deviceCredentials} />
      </MainContent>
    </>
  )
}

export default Settings

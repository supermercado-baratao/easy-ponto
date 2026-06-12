import { redirect } from 'next/navigation'

import { adminUserModel, userModel } from '@/models'

const RegistrosDePonto = async () => {
  const adminUser = await adminUserModel.findUniqueById(
    process.env.ADMIN_USER_ID!
  )

  const users = await userModel.findManyByCompanyId(adminUser?.companyId!)

  redirect(`/registros-de-ponto/${users[0].pis}`)
}

export default RegistrosDePonto

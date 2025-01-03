import { Roles } from '../../types'
import {  useUser } from '@clerk/clerk-react'

export const checkRole = async (role: Roles) => {
    const user=useUser().user;
    const result=await user?.publicMetadata?.role===role
    return result;
}
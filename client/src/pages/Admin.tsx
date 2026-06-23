import { FormEvent, useEffect, useState } from "react";
import { useLazyGetUsersQuery, useLazyUpdateUserRoleQuery } from "../utils/store/features/user/userApi";
import { userType } from "../types";
import { toast } from "react-toastify";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { Button } from "../shared/components/ui/Button";
import { APP_ROLES } from "../shared/constants/roles";

// Access is enforced by RoleProtectedRoute (client) and requireAdmin (server);
// no in-component gate needed.
const Admin = () => {

   const [username,setUsername]=useState("");
   const [users,setUsers]=useState<userType[]>()
   const [role,setRole]=useState("");
   const [getUsers]=useLazyGetUsersQuery();
   const [user,setUser]=useState<userType | null>(null)
   const [queryRan,setQueryRan]=useState(false);
   const [updateRole]=useLazyUpdateUserRoleQuery();
   const {token}=useAppSelector((state)=>state.auth)

   const handleSubmit=async (e: FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
   
   try{
    if(!username || !role ){
        toast.error("Username or Role is missing")
        return;
    }
    if(role==user?.username){
        toast.error("New Role Can't be same as previous one")
        return;
    }
    if(!token){
        toast.error("Token is missing")
        return;
    }
    const query=await updateRole({username,newRole:role,token}).unwrap()
        toast.success(query?.message);
    
   }catch(err){
   
    toast.error("Operation Failed")
   }finally{
    setRole("")
    setUser(null)
    setUsername("")
   }
   }

   const findUser=()=>{
    if(username===""){
        toast.error("Username is missing")
        return;
    }
    const user=users?.find((user:userType)=>user?.username==username)
    if(!user){
        toast.info("No user with given username exist.")
        return;
    }
    toast.success(`A ${user?.role} is found with username ${user?.username}`)
    setUser(user)
    setRole(user?.role);
   }
   useEffect(()=>{
    const fetchUsers=async()=>{
        if(queryRan) return;
        const query=await getUsers({}).unwrap();
        if(query){
            setUsers(query?.users)
            setQueryRan(true);
        }

    }
    fetchUsers();
  
   },[queryRan])
   return(
    <div className="w-screen h-screen text-on-surface flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold tracking-wider drop-shadow-xl">CHANGE USERS ROLE</h2>
        <form className="flex justify-center items-center p-5 flex-wrap gap-4 text-on-surface-variant " onSubmit={(e)=>handleSubmit(e)}>
            <input type="text" className="w-full p-3 py-2 mr-3 rounded-md placeholder:text-center ring-2 ring-primary/30" placeholder="Search User By username"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
          />
            <select value={role!=""?role:"Select Role"} onChange={((e)=>setRole(e.target.value))}  className="lg:px-20 px-12 py-2 rounded-md text-center" >
                {Object.values(APP_ROLES).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
            </select>
            <Button variant="unstyled" className="px-4 py-3 bg-surface-container-high text-on-surface rounded-xl"
            type="button" onClick={()=>findUser()}>Find User</Button>
            <Button variant="unstyled" className="px-4 py-3 bg-primary text-on-primary rounded-xl"
            type="submit">Change Role</Button>
        </form>
    </div>

   )
  
}

export default Admin
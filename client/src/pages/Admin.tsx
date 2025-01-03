
import {  redirect } from "react-router-dom"
import { checkRole } from "../utils/functions/roles";
import { FormEvent, useEffect, useState } from "react";
import { useLazyGetUsersQuery, useLazyUpdateUserRoleQuery } from "../utils/store/features/user/userApi";
import { userType } from "../types";
import { toast } from "react-toastify";
import { useAppSelector } from "../utils/hooks/storeHooks";




const Admin = () => {

   const isAdmin=checkRole("admin");
   if(!isAdmin){
    redirect("/foryou")
   }
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
   
    toast.error(String(err))
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
    toast.success(`User Found with username:${user?.username} and role:${user?.role}`)
    setUser(user)
    setRole(user?.role);
   }
   useEffect(()=>{
    const fetchUsers=async()=>{
        if(queryRan) return;
        const query=await getUsers({}).unwrap();
        if(query){
           toast.success(query?.message)
            setUsers(query?.users)
            setQueryRan(true);
        }

    }
    fetchUsers();
  
   },[queryRan])
   return(
    <div className="w-screen h-screen text-white flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold tracking-wider  shadow-slate-50 drop-shadow-xl">CHANGE USERS ROLE</h2>
        <form className="flex justify-center items-center p-5 flex-wrap gap-4 text-zinc-400 " onSubmit={(e)=>handleSubmit(e)}>
            <input type="text" className="w-full p-3 py-2 mr-3 rounded-md placeholder:text-center ring-2 ring-red-500/30" placeholder="Search User By username"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
          />
            <select value={role} onChange={((e)=>setRole(e.target.value))}  className="lg:px-20 px-12 py-2 rounded-md text-center" >
                <option className="w-full" value={"Creator"}>Creator</option>
                <option value="Consumer">Consumer</option>
            </select>
            <button className="px-4 py-3 bg-red-700 rounded-xl"
            type="button" onClick={()=>findUser()}>Find User</button>
            <button className="px-4 py-3 bg-blue-400/30 rounded-xl"
            type="submit">Change Role</button>
        </form>
    </div>

   )
  
}

export default Admin
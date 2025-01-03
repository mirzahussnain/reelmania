import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { userType } from "../../../../types";


const initialState:userType={
    avatar_url: "",
    created_at: "",
    email: "",
    first_name: "",
    id: "",
    last_name: "",
    role: "",
    username: "",
    followers:[]
}

const userSlice=createSlice({
    name: "user",
    initialState,
    reducers:{
        userSignedIn:(_state:userType,action:PayloadAction<userType>)=>{
            // const ISO_date=new Date(action.payload.created_at).toISOString();
            return action.payload;
        },
        userSignedOut:(_state:userType)=>{
           return initialState
        },
    }
})




export const {userSignedIn,userSignedOut}=userSlice.actions
export default userSlice.reducer
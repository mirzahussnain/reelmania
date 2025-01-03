import { SignIn } from "@clerk/clerk-react"
import { TiHome } from "react-icons/ti";
import { useNavigate } from "react-router-dom"
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { FaChevronLeft } from "react-icons/fa";



const Login = () => {
  const navigateTo=useNavigate();
  const screenWidth=useScreenWidth();
  return (
    <div className="w-full h-full flex items-start justify-center  py-3 lg:py-10 relative">
        <SignIn signUpUrl="/sign-up"/>
         <button className='absolute lg:top-0 lg:left-0 top-1 left-3 text-gray-500 sm:text-gray-200 p-3 lg:text-3xl text-xl' onClick={()=>navigateTo("/foryou")}
              title='Go to home'>{
                (screenWidth<768)?(<FaChevronLeft/>):(<TiHome/>)
              }</button>
    </div>
  )
}

export default Login
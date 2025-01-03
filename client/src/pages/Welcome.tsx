

import { useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { FaSignInAlt } from 'react-icons/fa';
import {  useNavigate } from 'react-router-dom';

export default function WelcomePage() {
    const {isSignedIn}=useAuth()
    const navigatTo=useNavigate()
   

    useEffect(()=>{
        if(isSignedIn){
            navigatTo('/foryou')
        }
    },[isSignedIn])
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-bold text-white">
            Welcome
            <span className="block mt-2 text-[#8B0000]">ReelMania</span>
          </h1>
          <p className="text-[#808080] text-lg">Choose how you want to continue</p>
        </div>

        <div className="space-y-4 flex flex-col justify-center items-center">
          <button className='lg:w-[30rem] w-[19rem] py-4 bg-red-800 rounded-lg flex justify-center items-center'
          onClick={()=>navigatTo("/sign-in")}>
           <FaSignInAlt className='text-2xl text-white'/>
           <span className='ml-5 text-xl text-white font-medium tracking-wider'>Sign in by Email</span>
          </button>
          
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2D2D2D]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 text-[#808080] bg-[#121212]">or</span>
            </div>
          </div>

          <button className='lg:w-[30rem] w-[20rem] py-4 bg-zinc-800 rounded-lg flex justify-center items-center'
          onClick={()=>navigatTo("/foryou")}>
          
           <span className='ml-5 text-xl text-white font-medium tracking-wider'>Continure as Guest</span>
          </button>

        <p className="mt-8 text-center text-sm text-[#808080]">
          By continuing, you agree to our{' '}
          <a href="#" className="text-[#8B0000] hover:text-[#660000] transition-colors">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="#" className="text-[#8B0000] hover:text-[#660000] transition-colors">
            Privacy Policy
          </a>
        </p>
      </div>
        </div>
      </div>
    
  );
}
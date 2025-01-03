import { SignUp } from "@clerk/clerk-react";
import { FaChevronLeft } from "react-icons/fa";
import { TiHome } from "react-icons/ti";
import { useNavigate } from "react-router-dom";
import useScreenWidth from "../utils/hooks/useScreenWidth";



const Register = () => {
  const navigateTo = useNavigate();
  const screenWidth = useScreenWidth();
  return (
    <div className="w-full h-full flex  items-start justify-center  to-black py-2 overflow-y-auto relative">
      <SignUp
        signInUrl="/sign-in"
        appearance={{
          elements: {
            card: {
              height: "37rem",
            },
          },
        }}
      />
      <button
        className="absolute lg:top-0 lg:left-0 top-1 left-3 text-gray-500 sm:text-gray-200 p-3 lg:text-3xl text-xl"
        onClick={() => navigateTo("/foryou")}
        title="Go to home"
      >
        {screenWidth < 768 ? <FaChevronLeft /> : <TiHome />}
      </button>
    </div>
  );
};

export default Register;

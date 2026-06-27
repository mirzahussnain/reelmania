import { SignUp } from "@clerk/clerk-react";
import { FaChevronLeft } from "react-icons/fa";
import { TiHome } from "react-icons/ti";
import { useNavigate } from "react-router-dom";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { Button } from "../shared/components/ui/Button";



const Register = () => {
  const navigateTo = useNavigate();
  const screenWidth = useScreenWidth();
  return (
    <div className="w-full h-full flex  items-start justify-center  py-2 overflow-y-auto relative">
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
      <Button
        variant="unstyled"
        className="absolute lg:top-0 lg:left-0 top-1 left-3 text-on-surface-variant sm:text-on-surface p-3 lg:text-3xl text-xl"
        onClick={() => navigateTo("/foryou")}
        title="Go to home"
      >
        {screenWidth < 768 ? <FaChevronLeft /> : <TiHome />}
      </Button>
    </div>
  );
};

export default Register;

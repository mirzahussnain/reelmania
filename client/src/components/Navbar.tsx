import { FaHome, FaRegEdit } from "react-icons/fa";
import { IoMenu } from "react-icons/io5";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { useEffect, useState, useCallback, useMemo } from "react";
import { FaX } from "react-icons/fa6";
import { SignOutButton, UserButton, useUser } from "@clerk/clerk-react";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { MdManageAccounts } from "react-icons/md";
import { BiSolidVideo } from "react-icons/bi";
import { RootState } from "../utils/store/store.ts";

const Navbar: React.FC = () => {
  const screenWidth: number = useScreenWidth();
  const [showNav, setShowNav] = useState<boolean>(screenWidth > 600);
  const { isSignedIn } = useUser();
  const user = useAppSelector((state: RootState) => state.user);
  const navigateTo = useNavigate();
  const currentLocation = useLocation();

  const toggleNav = useCallback(() => {
    setShowNav((prev) => !prev);
  }, []);

  useEffect(() => {
    if (screenWidth > 1016) {
      setShowNav(true);
    }
  }, [screenWidth, isSignedIn]);

  const navItems = useMemo(
    () => (
      <>
        <NavLink
          to="/foryou"
          className="mx-2 lg:mr-10 py-2 w-full lg:w-auto text-center border-y-[1px] lg:mt-0 lg:border-none lg:py-0 flex justify-center items-center"
        >
          <FaHome className="text-2xl" />
          <span className="mx-2 text-lg">Home</span>
        </NavLink>
        {isSignedIn && user && (
          <>
            <NavLink
              to={`/users/${user?.id}/profile/manage`}
              className=" py-2 lg:mr-5 w-full lg:w-auto text-center border-t-[1px] my-2 lg:hidden flex justify-center items-center"
            >
              <MdManageAccounts className="text-2xl" />
              <span className="mx-2 text-lg">Manage Profile</span>
            </NavLink>
            {user?.role?.includes("Creator") && (
              <NavLink
                to={`/users/${user?.username}/videos/manage`}
                className=" py-2 lg:mr-10 w-full lg:w-auto text-center border-y-[1px] lg:mt-0 lg:border-none lg:py-4 flex justify-center items-center"
              >
                <FaRegEdit className="text-2xl" />
                <span className="mx-2 text-lg">Manage Videos</span>
              </NavLink>
            )}
          </>
        )}
        <NavLink
          to="/explore"
          className="mx-2  py-2  w-full lg:w-auto lg:mr-28 text-center border-y-[1px] mt-2 lg:mt-0 lg:border-none lg:py-0 flex justify-center items-center"
        >
          <BiSolidVideo className="text-2xl" />
          <span className="mx-2 text-lg">Explore</span>
        </NavLink>
      </>
    ),
    [isSignedIn, user]
  );

  return (
    <>
      {currentLocation.pathname.includes("/sign-in") ||
      currentLocation.pathname.includes("/sign-up") ? null : (
        <>
          <div
            className="absolute lg:hidden lg:text-white text-white left-0 text-2xl z-50 transition-all ease-in-out duration-75"
            onClick={toggleNav}
          >
            {showNav ? <FaX /> : <IoMenu className="text-3xl" />}
          </div>
          <div
            className={
              showNav
                ? `w-[15rem]  lg:w-full lg:h-14 flex flex-col lg:flex-row justify-between items-center bg-black
    rounded-br-xl lg:rounded-none lg:relative absolute z-40 overflow-y-auto lg:overflow-hidden`
                : `w-0 h-0 overflow-hidden`
            }
          >
            <div className="w-full h-[15rem] lg:h-full lg:w-2/6 px-2 flex flex-col items-center justify-center">
              <Link to="/foryou">
                <img
                  src="/images/logo-3.png"
                  className="object-cover h-full w-full lg:w-[10rem] text-white"
                  alt="Logo"
                />
              </Link>
              {isSignedIn && user && (
                <span className="mx-4 whitespace-nowrap text-white text-center lg:hidden">
                  Hi, <strong>{user?.username}</strong>
                </span>
              )}
            </div>

            <div className=" w-full h-full flex flex-col lg:flex-row justify-center items-center lg:items-baseline">
              <ul
                className=" w-full h-full flex flex-col lg:flex-row justify-start lg:justify-evenly items-center  px-2 whitespace-nowrap text-white text-sm"
                id="nav"
              >
                {navItems}
              </ul>
              <div className="w-[6rem] h-full flex justify-start items-center px-4 lg:mr-24">
                {isSignedIn && user ? (
                  <>
                    <div className="lg:hidden px-3 text-white text-nowrap py-1 bg-purple-500 rounded-lg mt-2 flex justify-center items-center ">
                      <SignOutButton />
                    </div>
                    <div className="w-full h-full lg:flex lg:items-end lg:justify-center text-white p-2 lg:mt-3  hidden">
                      <h2 className="font-sans mr-1 text-3xl font-semibold">
                        Hi,
                        <span className="text-lg mr-3 ml-1">
                          {user?.username}
                        </span>
                      </h2>
                      <UserButton
                        appearance={{
                          elements: {
                            avatarBox: {
                              width: "2.4rem",
                              height: "2.4rem",
                            },
                          },
                        }}
                        userProfileMode="navigation"
                        userProfileUrl={`/users/${user.id}/profile/manage`}
                      />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex text-center justify-center items-end text-white text-lg mr-1 ">
                    <button
                      className="w-[7rem] mt-3 lg:mt-0 px-4 bg-red-500 rounded-md whitespace-nowrap hover:bg-red-600 lg:mr-24 lg:py-2"
                      onClick={() => {
                        navigateTo("/sign-in");
                      }}
                    >
                      Sign in
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;

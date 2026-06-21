import React, { ReactNode } from "react";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode; // explicitly typing the children prop
}

const Layout: React.FC<LayoutProps> = ({ children }) => {

 
  return (
    <div className="w-full h-[100dvh] overflow-hidden relative bg-background flex flex-col">
      <Navbar /> {/* Navbar should always be at the top */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {children} {/* Render children passed to the Layout */}
      </div>
    </div>
  );
};

export default Layout;

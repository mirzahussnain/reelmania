import React, { ReactNode } from "react";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode; // explicitly typing the children prop
}

const Layout: React.FC<LayoutProps> = ({ children }) => {

 
  return (
    <div className="w-screen h-screen  overflow-hidden relative bg-black/90">
      <Navbar /> {/* Navbar should always be at the top */}
      <div className="h-full w-full">
        {children} {/* Render children passed to the Layout */}
      </div>
    </div>
  );
};

export default Layout;

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useRole } from "../hooks/useRole";
import Loader from "../../components/Loader";

// Route guard for role-gated areas (driven by routes.config `access`).
// Today only "admin" is used; the prop keeps it open to future roles.
export const RoleProtectedRoute = ({ require }: { require: "admin" }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { isAdmin, isLoaded: roleLoaded } = useRole();

  if (!isLoaded || !roleLoaded) return <Loader />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  if (require === "admin" && !isAdmin) return <Navigate to="/foryou" replace />;

  return <Outlet />;
};

export default RoleProtectedRoute;

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Suspense, useEffect } from "react";
import Layout from "./components/Layout";
import Loader from "./components/Loader";
import {useGetMyProfileQuery} from "./utils/store/features/user/userApi";
import { useAppDispatch, useAppSelector } from "./utils/hooks/storeHooks";
import { userSignedIn, userSignedOut } from "./utils/store/features/user/userSlice";
import { APP_ROUTES } from "./app/routes.config";
import { RoleProtectedRoute } from "./shared/components/RoleProtectedRoute";
import { RootState } from "./utils/store/store";
import { setToken } from "./utils/store/features/user/authSlice";


// Protected Route Component
const ProtectedRoute = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <Loader />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }

  return <Outlet />;
};

// Routes grouped by access: public (incl. the "*" catch-all), sign-in only,
// and admin-only (gated by RoleProtectedRoute).
const publicRoutes = APP_ROUTES.filter((r) => r.access === "public");
const authRoutes = APP_ROUTES.filter((r) => r.access === "auth");
const adminRoutes = APP_ROUTES.filter((r) => r.access === "role:admin");

// Main App Component
const App = () => {
  const {token}=useAppSelector((state:RootState)=>state.auth)
  const { isSignedIn, user } = useUser();
  const dispatch = useAppDispatch();
  const {getToken}=useAuth();
  

  const queryParam = {
    id: user?.id,
    token,
  };

  const { data} = useGetMyProfileQuery(queryParam, {
    skip: !isSignedIn || !user?.id
  });

  useEffect(() => {
    // Fetch token if it doesn't exist or is expiring
    let intervalId: NodeJS.Timeout;
    if (isSignedIn) {
      const fetchToken = async () => {
        const newToken = await getToken();
        dispatch(setToken(newToken));
      };
      fetchToken();
      
      // Auto-refresh the token every 30 seconds to prevent 401s during long sessions
      intervalId = setInterval(fetchToken, 30000);
    }
  
    // Handle user state updates if signed in
    if (isSignedIn && data?.body) {
      dispatch(userSignedIn(data.body));
    }
  
    // Handle user sign-out if user signs out
    if (!isSignedIn) {
      dispatch(setToken(null));
      dispatch(userSignedOut());
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSignedIn, data, dispatch, token, getToken]);

  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Layout>
          <Routes>
            {/* Public routes (generated from routes.config.ts) */}
            {publicRoutes.map(({ path, component: Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}

            {/* Protected routes — require sign-in */}
            <Route element={<ProtectedRoute />}>
              {authRoutes.map(({ path, component: Component }) => (
                <Route key={path} path={path} element={<Component />} />
              ))}
            </Route>

            {/* Admin routes — require an admin role (client + server enforced) */}
            <Route element={<RoleProtectedRoute require="admin" />}>
              {adminRoutes.map(({ path, component: Component }) => (
                <Route key={path} path={path} element={<Component />} />
              ))}
            </Route>
          </Routes>
        </Layout>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;

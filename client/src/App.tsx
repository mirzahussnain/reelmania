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
import { routes } from "./utils/functions/routeLoader";
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

// Main App Component
const App = () => {
  const Home = routes["Home"]
  const ManageProfile = routes["ManageProfile"];
  const ManageVideos = routes["ManageVideos"];
  const VideoInfo =routes["VideoInfo"];
  const Login = routes["SignIn"];
  const Register =routes["SignUp"];
  const UserProfile=routes["UserProfile"];
  const Admin=routes["Admin"];
  const Explore=routes["Explore"];
  const Welcome=routes["Welcome"];
  const NotFound = routes["NotFound"]; 
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
    // Fetch token if it doesn't exist
    if (isSignedIn) {
      const fetchToken = async () => {
        const newToken = await getToken();
        dispatch(setToken(newToken));
      };
      fetchToken();
    }
  
    // Handle user state updates if signed in
    if (isSignedIn && data) {
      dispatch(userSignedIn(data.body));
    }
  
    // Handle user sign-out if user signs out
    if (!isSignedIn) {
      dispatch(setToken(null));
      dispatch(userSignedOut());
    }
  }, [isSignedIn, data, dispatch, token, getToken]);

  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/sign-in" element={<Login />} />
            <Route path="/sign-up" element={<Register />} />
            <Route path="/" element={<Welcome/>} />
            <Route path="/foryou" element={<Home />} />
            <Route path="/users/:username" element={<UserProfile/>}/>
            <Route path="/videos/:videoId" element={<VideoInfo />} />
            <Route path="/explore" element={<Explore/>}/>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<Admin/>}/>
              <Route
                path="/users/:userId/profile/manage"
                element={<ManageProfile />}
              />
              <Route
                path="/users/:username/videos/manage"
                element={<ManageVideos />}
              />
            </Route>

            {/* Other Routes */}
            <Route path="*" element={<NotFound/>} />

          </Routes>
        </Layout>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;

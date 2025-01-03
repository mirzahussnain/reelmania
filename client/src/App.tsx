import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Suspense, useEffect, useMemo } from "react";
import Layout from "./components/Layout";
import Loader from "./components/Loader";
import {useGetMyProfileQuery} from "./utils/store/features/user/userApi";
import { useAppDispatch, useAppSelector } from "./utils/hooks/storeHooks";
import { userSignedIn, userSignedOut } from "./utils/store/features/user/userSlice";
import { loadLazyRoute } from "./utils/functions/routeLoader";
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
  const Home = useMemo(() => loadLazyRoute("Home"), []);
  const ManageProfile = useMemo(() => loadLazyRoute("ManageProfile"), []);
  const ManageVideos = useMemo(() => loadLazyRoute("ManageVideos"), []);
  const VideoInfo = useMemo(() => loadLazyRoute("VideoInfo"), []);
  const Login = useMemo(() => loadLazyRoute("SignIn"), []);
  const Register = useMemo(() => loadLazyRoute("SignUp"), []);
  const UserProfile=useMemo(() => loadLazyRoute("UserProfile"), []);
  const Admin=useMemo(()=>loadLazyRoute("Admin"),[]);
  const Explore=useMemo(()=>loadLazyRoute("Explore"),[]);
  const Welcome=useMemo(()=>loadLazyRoute("Welcome"),[]);
  const NotFound = useMemo(() => loadLazyRoute("NotFound"), []); 
  const {token}=useAppSelector((state:RootState)=>state.auth)
  const videos=useAppSelector((state:RootState)=>state.video.videos)
  const { isSignedIn, user } = useUser();
  const dispatch = useAppDispatch();
  const { getToken } = useAuth();


  const queryParam = useMemo(() => ({
    id: user?.id,
    token,
  }), [user?.id, token]);

  const { data} = useGetMyProfileQuery(queryParam, {
    skip: !isSignedIn,
  });

  useEffect(() => {
    const fetchSessionToken = async () => {
      if (getToken) {
        try {
          const fetchedToken = await getToken(); // Await the token asynchronously
          dispatch(setToken(fetchedToken)); // Set the token in the state
        } catch (error) {
          console.error("Error fetching token:", error);
        }
      }
    };

    if (isSignedIn && user) {
      fetchSessionToken(); // Only fetch token if user is signed in
    }
  }, [isSignedIn, user, getToken,videos]);

  useEffect(() => {
    if(!isSignedIn)
    {
      dispatch(setToken(null))
      dispatch(userSignedOut())
    }
   },[isSignedIn,dispatch])

 
  useEffect(() => {
   
    if (isSignedIn && data) {
     
      dispatch(userSignedIn(data.body));
    }
  }, [isSignedIn, data, dispatch,user]);

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

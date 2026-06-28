import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider } from "@clerk/clerk-react";
import { Provider } from "react-redux";
import { store } from "./utils/store/store.ts";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import {ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SocketProvider } from "./shared/providers/SocketProvider";
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const persisttor = persistStore(store);

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/foryou">
      <Provider store={store}>
        <PersistGate persistor={persisttor}>
          <SocketProvider>
            <App />
            <ToastContainer
              position="bottom-center"
              autoClose={3000}
              newestOnTop
              closeOnClick
              pauseOnHover
              theme="dark"
              toastClassName="kinetix-toast"
            />
          </SocketProvider>
        </PersistGate>
      </Provider>
    </ClerkProvider>
  </StrictMode>
);

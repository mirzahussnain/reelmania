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
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLIC_KEY;
let persisttor = persistStore(store);

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/foryou">
      <Provider store={store}>
        <PersistGate persistor={persisttor}>
          
          <App />
          <ToastContainer/>
        </PersistGate>
      </Provider>
    </ClerkProvider>
  </StrictMode>
);

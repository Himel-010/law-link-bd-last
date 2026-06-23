import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Layout from "./Components/Layout/Layout";
import Home from "./Components/Home/Home";
import SignIn from "./Components/SingIn/SignIN";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./Redux/Store/Store";
import SignUp from "./Components/SingUP/SignUP";
import LawyersPage from "./Components/LawyersPage/LawyersPage";
import ContactPage from "./Components/Contact/ContactPage";
import ResourcesPage from "./Components/ResourcesPage/ResourcesPage";
import Dashboard from "./Components/Dashboard/Dashboard";
import Post from "./Components/Post/Post";
import PostDetails from "./Components/Post/PostDetails/PostDetails";
import UserProfile from "./Components/UserProfile/UserProfile";
import UserSettings from "./Components/UserSettings/UserSettings";
import PlansPage from "./Components/Plans/PlansPage";
import CompleteLawyerProfile from "./Components/CompleteLawyerProfile/CompleteLawyerProfile";
import LawyerDashboard from "./Components/LawyersDashboard/LawyersDashboard";
import LawyersDetailsPage from "./Components/LawyersPage/LawyersDetailsPage/LawyersDetailsPage";
import AboutUsPage from "./Components/About/About";
import PaymentPage from "./Components/Payment/PaymentPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "", element: <Home /> },
      { path: "sign-in", element: <SignIn /> },
      { path: "sign-up", element: <SignUp /> },
      { path: "lawyers", element: <LawyersPage /> },
      { path: "lawyers/:id", element: <LawyersDetailsPage /> },
      { path: "contact-us", element: <ContactPage /> },
      { path: "resources", element: <ResourcesPage /> },
      { path: "admin", element: <Dashboard /> },
      { path: "posts", element: <Post /> },
      { path: "posts/:id", element: <PostDetails /> },
      { path: "profile", element: <UserProfile /> },
      { path: "settings", element: <UserSettings /> },
      { path: "lawyer/dashboard", element: <LawyerDashboard /> },
      { path: "lawyer/complete-profile", element: <CompleteLawyerProfile /> },
      { path: "plans", element: <PlansPage /> },
      { path: "payment", element: <PaymentPage /> },
      { path: "about-us", element: <AboutUsPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  </StrictMode>
);
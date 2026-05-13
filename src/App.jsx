import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import Login from "./pages/Login";
import AdminLayout from "./components/layout/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import Users from "./pages/admin/Users";
import Companies from "./pages/admin/Companies";
import Candidates from "./pages/admin/Candidates";
import BlockedAccounts from "./pages/admin/BlockedAccounts";
import Jobs from "./pages/admin/Jobs";
import Skills from "./pages/admin/Skills";
import Applications from "./pages/admin/Applications";
import Interviews from "./pages/admin/Interviews";
import Submissions from "./pages/admin/Submissions";
import Notifications from "./pages/admin/Notifications";
import Files from "./pages/admin/Files";
import Messages from "./pages/admin/Messages";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";
import { getAuthUser } from "./lib/auth";

function HomeRedirect() {
  const user = getAuthUser();
  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

function RequireAdminRoute() {
  const user = getAuthUser();
  if (user?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function LoginRedirect() {
  const user = getAuthUser();
  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Login />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRedirect />,
  },
  {
    path: "/login",
    element: <LoginRedirect />,
  },
  {
    path: "/admin",
    element: <RequireAdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <Overview />,
          },
          {
            path: "users",
            element: <Users />,
          },
          {
            path: "companies",
            element: <Companies />,
          },
          {
            path: "candidates",
            element: <Candidates />,
          },
          {
            path: "blocked",
            element: <BlockedAccounts />,
          },
          {
            path: "jobs",
            element: <Jobs />,
          },
          {
            path: "skills",
            element: <Skills />,
          },
          {
            path: "applications",
            element: <Applications />,
          },
          {
            path: "interviews",
            element: <Interviews />,
          },
          {
            path: "submissions",
            element: <Submissions />,
          },
          {
            path: "notifications",
            element: <Notifications />,
          },
          {
            path: "files",
            element: <Files />,
          },
          {
            path: "messages",
            element: <Messages />,
          },
          {
            path: "reports",
            element: <Reports />,
          },
          {
            path: "settings",
            element: <Settings />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

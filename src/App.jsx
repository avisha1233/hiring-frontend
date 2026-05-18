import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
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
import Home from "./pages/Home";
import CompanyLayout from "./components/layout/company/CompanyLayout";
import CompanyOverview from "./pages/company/Overview";
import CompanyApplications from "./pages/company/Applications";
import CompanyCandidates from "./pages/company/Candidates";
import CompanyTasks from "./pages/company/Tasks";
import CompanyInterviews from "./pages/company/Interviews";
import CompanySubmissions from "./pages/company/Submissions";
import CompanyMessages from "./pages/company/Messages";
import CompanyProfile from "./pages/company/Profile";
import CandidateLayout from "./components/layout/CandidateLayout";
import CandidateOverview from "./pages/candidate/Overview";
import MyApplications from "./pages/candidate/MyApplications";
import CandidateMessages from "./pages/candidate/Messages";

import Profile from "./pages/candidate/Profile";
import { getAuthUser } from "./lib/auth";
import BrowseJobs from "./pages/candidate/BrowseJobs";

function HomeRedirect() {
  const user = getAuthUser();

  if (!user) return <Navigate to="/home" replace />;

  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user?.role === "company") {
    return <Navigate to="/company/dashboard" replace />;
  }

  if (user?.role === "candidate") {
    return <Navigate to="/candidate/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

function RequireAdminRoute() {
  const user = getAuthUser();

  if (!user) return <Navigate to="/login" replace />;

  if (user?.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}

function RequireCompanyRoute() {
  const user = getAuthUser();

  if (!user) return <Navigate to="/login" replace />;

  if (user?.role !== "company") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function RequireCandidateRoute() {
  const user = getAuthUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user?.role !== "candidate") {
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

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <HomeRedirect />,
    },
    {
      path: "/login",
      element: <LoginRedirect />,
    },
    {
      path: "/admin/login",
      element: <AdminLogin />,
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
      path: "/home",
      element: <Home />,
    },

<<<<<<< HEAD
    {
      path: "/company",
      element: <RequireCompanyRoute />,
      children: [
        {
          element: <CompanyLayout />,
          children: [
            {
              index: true,
              element: <Navigate to="/company/dashboard" replace />,
            },
            {
              path: "dashboard",
              element: <CompanyOverview />,
            },
          ],
        },
      ],
    },
=======
  {
    path: "/register",
    element: <Login />,
  },

  {
    path: "/register/company",
    element: <Login />,
  },

  {
    path: "/register/candidate",
    element: <Login />,
  },

  {
    path: "/company",
    element: <RequireCompanyRoute />,
    children: [
      {
        element: <CompanyLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/company/dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <CompanyOverview />,
          },

          {
            path:"jobs",
            element: <Navigate to="/company/jobs" replace />,
          },
          {
            path: "applications",
            element: <CompanyApplications />,
          },
          {
            path: "candidates",
            element: <CompanyCandidates />,
          },
          {
            path: "tasks",
            element: <CompanyTasks />,
          },
          {
            path: "interviews",
            element: <CompanyInterviews />,
          },
          {
            path: "submissions",
            element: <CompanySubmissions />,
          },
          {
            path: "messages",
            element: <CompanyMessages />,
          },
          {
            path: "profile",
            element: <CompanyProfile />,
          },


        ],
      },
    ],
  },
>>>>>>> cd4b66d73995af089e087abcfd602ae124cb9b40

    {
      path: "/candidate",
      element: <RequireCandidateRoute />,
      children: [
        {
          element: <CandidateLayout />,
          children: [
            {
              index: true,
              element: <Navigate to="/candidate/dashboard" replace />,
            },
            {
              path: "dashboard",
              element: <CandidateOverview />,
            },

            {
              path: "jobs",
              element: <BrowseJobs />,
            },
            {
              path: "applications",
              element: <MyApplications />,
            },
            {
              path: "messages",
              element: <CandidateMessages />,
            },

            {
              path: "profile",
              element: <Profile />,
            },
          ],
        },
      ],
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
    },
  },
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

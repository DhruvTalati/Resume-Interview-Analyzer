import { createBrowserRouter, ScrollRestoration } from "react-router";
import { lazy, Suspense } from "react";
import Protected from "./features/auth/component/Protected";

// ── Lazy-loaded pages — each page is its own JS chunk ────────────────────────
// This means the user only downloads code for the page they're visiting,
// not the entire app upfront. Critical for production performance.
const Login = lazy(() => import("./features/auth/pages/Login"));
const Register = lazy(() => import("./features/auth/pages/Register"));
const Home = lazy(() => import("./features/interview/pages/Home"));
const Interview = lazy(() => import("./features/interview/pages/interview"));
const Dashboard = lazy(() => import("./features/dashboard/pages/Dashboard"));
const ATSResume = lazy(() => import("./features/ats/pages/ATSResume"));
const Reports = lazy(() => import("./features/reports/pages/Reports"));
const Profile = lazy(() => import("./features/profile/pages/Profile"));

// ── 404 fallback ──────────────────────────────────────────────────────────────
const NotFound = () => (
  <main
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#07111f",
      color: "#f8fafc",
      fontFamily: "Inter, sans-serif",
      gap: "1rem",
    }}
  >
    <h1
      style={{ fontSize: "5rem", fontWeight: 800, color: "#00c6a2", margin: 0 }}
    >
      404
    </h1>
    <p style={{ color: "#94a3b8", fontSize: "1rem" }}>
      This page doesn't exist.
    </p>
    <a
      href="/"
      style={{
        marginTop: "0.5rem",
        padding: "0.6rem 1.4rem",
        background: "linear-gradient(135deg,#00c6a2,#00b4d8)",
        color: "#07111f",
        borderRadius: "12px",
        fontWeight: 700,
        fontSize: "0.9rem",
        textDecoration: "none",
      }}
    >
      Back to home
    </a>
  </main>
);

// ── Page-level loading fallback ───────────────────────────────────────────────
const PageLoader = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#07111f",
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "3px solid rgba(255,255,255,0.08)",
        borderTopColor: "#00c6a2",
        animation: "spin 0.7s linear infinite",
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Wrap a lazy page in Suspense ──────────────────────────────────────────────
const Page = ({ component: Component }) => (
  <Suspense fallback={<PageLoader />}>
    <ScrollRestoration />
    <Component />
  </Suspense>
);

// ── Router ────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // Public routes
  {
    path: "/login",
    element: <Page component={Login} />,
  },
  {
    path: "/register",
    element: <Page component={Register} />,
  },

  // Protected routes
  {
    path: "/",
    element: (
      <Protected>
        <Page component={Home} />
      </Protected>
    ),
  },
  {
    path: "/interview/:interviewId",
    element: (
      <Protected>
        <Page component={Interview} />
      </Protected>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <Protected>
        <Page component={Dashboard} />
      </Protected>
    ),
  },
  {
    path: "/ats-resume",
    element: (
      <Protected>
        <Page component={ATSResume} />
      </Protected>
    ),
  },
  {
    path: "/reports",
    element: (
      <Protected>
        <Page component={Reports} />
      </Protected>
    ),
  },
  {
    path: "/profile",
    element: (
      <Protected>
        <Page component={Profile} />
      </Protected>
    ),
  },

  // 404 catch-all
  {
    path: "*",
    element: <NotFound />,
  },
]);

import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { AuthLayout } from "./layouts/AuthLayout";
import { MainLayout } from "./layouts/MainLayout";
import { Login } from "../pages/Auth/Login";
import { Register } from "../pages/Auth/Register";
const Profile = lazy(() =>
  import("../pages/Profile/Profile").then((m) => ({ default: m.Profile })),
);
const Feed = lazy(() =>
  import("../pages/Feed/Feed").then((m) => ({ default: m.Feed })),
);
import Home from "../pages/Home";
const UiDemo = lazy(() =>
  import("../pages/UiDemo").then((m) => ({ default: m.UiDemo })),
);
const DesignSystem = lazy(() =>
  import("../pages/DesignSystem").then((m) => ({ default: m.DesignSystem })),
);

const showDemos = import.meta.env.DEV;

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              {showDemos && (
                <>
                  <Route path="/ui-demo" element={<UiDemo />} />
                  <Route path="/design-system" element={<DesignSystem />} />
                </>
              )}
              <Route path="/feed" element={<Feed />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/:username" element={<Profile />} />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

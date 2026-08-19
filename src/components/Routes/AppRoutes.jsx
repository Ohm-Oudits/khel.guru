import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import {
  accountRouteModules,
  gameRouteModules,
  redirectRoutes,
  settingsRouteModules,
  sportRouteModules,
  topLevelRouteModules,
  transactionRouteModules,
} from "../../config/routeRegistry";
import LoadingSpinner from "../LoadingSpinner";

const LazyWrapper = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading page..." />
      </div>
    }
  >
    {children}
  </Suspense>
);

const allLazyRoutes = [
  ...topLevelRouteModules,
  ...sportRouteModules,
  ...gameRouteModules,
  ...transactionRouteModules,
  ...accountRouteModules,
  ...settingsRouteModules,
].map((route) => ({
  ...route,
  Component: lazy(route.loader),
}));

const AppRoutes = () => {
  return (
    <Routes>
      {redirectRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<Navigate replace to={route.to} />}
        />
      ))}

      {allLazyRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <LazyWrapper>
              <route.Component />
            </LazyWrapper>
          }
        />
      ))}

      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
};

export default AppRoutes;

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./layouts/AppLayout";

import RequireAuth from "./components/RequireAuth";
import RequireGuest from "./components/RequireGuest";

import ProductsList from "./pages/products/ProductsList";
import ProductCreate from "./pages/products/ProductCreate";

import CustomersList from "./pages/customers/CustomersList";
import CustomerCreate from "./pages/customers/CustomerCreate";

import ProfilesSearch from "./pages/profiles/ProfilesSearch";
import ProfileForm from "./pages/profiles/ProfileForm";
import ProfileView from "./pages/profiles/ProfileView";
import HoroscopeView from "./pages/HoroscopeView";
import HoroscopeTemplate from "./pages/profiles/HoroscopeTemplate_Temp";
import ProfilePreference from "./pages/profiles/ProfilePreferences";
import ProfileMatch from "./pages/profiles/ProfileMatch";
import AdminPage from "./pages/AdminPage";

import TaskPane from "./components/dashboard/TaskPane";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* GUEST ONLY */}
        <Route
          path="/login"
          element={
            <RequireGuest>
              <Login />
            </RequireGuest>
          }
        />

        {/* AUTH REQUIRED */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>

            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* Profiles */}
            <Route path="/profiles" element={<ProfilesSearch />} />
            <Route path="/profiles/new" element={<ProfileForm />} />
            <Route path="/profiles/:id/edit" element={<ProfileForm />} />
            <Route path="/profiles/:id" element={<ProfileView />} />
            <Route path="/profiles/:id/horoscope" element={<HoroscopeView />} />
            <Route path="/profiles/:id/preferences" element={<ProfilePreference />} />
            <Route path="/profiles/:id/match" element={<ProfileMatch />} />

            {/* Products */}
            <Route path="/products" element={<ProductsList />} />
            <Route path="/products/new" element={<ProductCreate />} />

            {/* Customers */}
            <Route path="/customers" element={<CustomersList />} />
            <Route path="/customers/new" element={<CustomerCreate />} />

            {/* Tasks */}
            <Route path="/tasks/:id" element={<TaskPane />} />

            {/* Admin — admin only */}
            <Route path="/admin" element={<AdminPage />} />

          </Route>
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
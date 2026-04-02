import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ManagePage from './pages/ManagePage';
import ProfilePage from './pages/ProfilePage';
import BrowsePage from './pages/BrowsePage';
import SearchPage from './pages/SearchPage';
import MySeriesPage from './pages/MySeriesPage';
import AdminPage from './pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="browse" element={<BrowsePage />} />
                <Route path="browse/:locationId" element={<BrowsePage />} />
                <Route path="search" element={<SearchPage />} />

                <Route path="profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />

                <Route path="my-series" element={
                  <ProtectedRoute requireContributor>
                    <MySeriesPage />
                  </ProtectedRoute>
                } />

                <Route path="manage" element={
                  <ProtectedRoute>
                    <ManagePage />
                  </ProtectedRoute>
                } />

                <Route path="admin" element={
                  <ProtectedRoute requireAdmin>
                    <AdminPage />
                  </ProtectedRoute>
                } />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

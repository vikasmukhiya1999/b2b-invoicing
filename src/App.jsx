import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// KYC Components
import KycForm from './components/kyc/KycForm';

// Dashboard Components
import DashboardLayout from './components/layout/DashboardLayout';
import SellerDashboard from './components/dashboard/SellerDashboard';
import BuyerDashboard from './components/dashboard/BuyerDashboard';

// Invoice Components
import CreateInvoice from './components/invoice/CreateInvoice';
import InvoiceDetails from './components/invoice/InvoiceDetails';
import InvoiceList from './components/invoice/InvoiceList';
import BuyerInvoiceList from './components/invoice/BuyerInvoiceList';

// Protected Route
const ProtectedRoute = ({ children, allowedRoles, requireKYC = true }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if KYC is required and not completed, but don't redirect if already on KYC page
  if (requireKYC && !user.kycCompleted && window.location.pathname !== '/kyc') {
    return <Navigate to="/kyc" replace />;
  }

  // Check if user has the required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = user.role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

const AuthRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Only redirect to KYC if not completed and not already on KYC page
    if (!user.kycCompleted && window.location.pathname !== '/kyc') {
      return <Navigate to="/kyc" replace />;
    }
    // Only redirect to dashboard if KYC is completed and not already on dashboard
    if (user.kycCompleted && !window.location.pathname.includes('/dashboard')) {
      const redirectPath = user.role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
          
          {/* KYC Route */}
          <Route path="/kyc" element={
            <ProtectedRoute requireKYC={false}>
              <KycForm />
            </ProtectedRoute>
          } />

          {/* Seller Routes */}
          <Route path="/seller" element={
            <ProtectedRoute allowedRoles={['seller']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="invoices/create" element={<CreateInvoice />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            {/* More seller routes will be added */}
          </Route>

          {/* Buyer Routes */}
          <Route path="/buyer" element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<BuyerDashboard />} />
            <Route path="invoices" element={<BuyerInvoiceList />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            {/* More buyer routes will be added */}
          </Route>

          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* 404 - Not Found */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-red-600">404</h1>
                <p className="text-xl text-gray-600 mt-2">Page Not Found</p>
                <p className="text-gray-500 mt-4">The page you're looking for doesn't exist.</p>
                <div className="mt-6">
                  <a href="/" className="text-blue-600 hover:underline">Go back home</a>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;

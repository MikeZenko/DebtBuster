import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthStore } from './store/useAuthStore';

// Lazy load components for better performance
const Landing = lazy(() => import('./pages/Landing').then(module => ({ default: module.Landing })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const LoanComparison = lazy(() => import('./pages/LoanComparison').then(module => ({ default: module.LoanComparison })));
const DebtCoach = lazy(() => import('./pages/DebtCoach').then(module => ({ default: module.DebtCoach })));
const Analytics = lazy(() => import('./pages/Analytics').then(module => ({ default: module.Analytics })));
const Education = lazy(() => import('./pages/Education').then(module => ({ default: module.Education })));
const Community = lazy(() => import('./pages/Community').then(module => ({ default: module.Community })));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public landing page */}
            <Route 
              path="/welcome" 
              element={
                isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <ErrorBoundary>
                    <Landing />
                  </ErrorBoundary>
                )
              } 
            />
            
            {/* Protected app routes */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/loans" element={<LoanComparison />} />
                        <Route path="/debt-coach" element={<DebtCoach />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/education" element={<Education />} />
                        <Route path="/community" element={<Community />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Default redirect */}
            <Route 
              path="*" 
              element={
                <Navigate 
                  to={isAuthenticated ? "/" : "/welcome"} 
                  replace 
                />
              } 
            />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

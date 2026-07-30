import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import GraphPage from './pages/GraphPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ProfilePage from './pages/Profile.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPage from './pages/ResetPage.jsx';
import VerifyPage from './pages/VerifyPage.jsx';
import VerifiedPage from './pages/VerifiedPage.jsx';
import { AuthProvider } from './lib/authContext.jsx';

const BASENAME = '/';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <HomePage />
    },
    {
      path: '/graph',
      element: <GraphPage />
    },
    {
      path: '/login',
      element: <LoginPage />
    },
    {
      path: '/signup',
      element: <SignupPage />
    },
    {
      path: '/forgot-password',
      element: <ForgotPasswordPage />
    },
    {
      path: '/auth/reset',
      element: <ResetPage />
    },
    {
      path: '/auth/verify',
      element: <VerifyPage />
    },
    {
      path: '/auth/verified',
      element: <VerifiedPage />
    },
    {
      path: '/me',
      element: <ProfilePage />
    }
  ],
  {
    basename: BASENAME
  }
);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

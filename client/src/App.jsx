import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import GraphPage from './pages/GraphPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ProfilePage from './pages/Profile.jsx';

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
      path: '/me',
      element: <ProfilePage />
    }
  ],
  {
    basename: BASENAME
  }
);

export default function App() {
  return <RouterProvider router={router} />;
}

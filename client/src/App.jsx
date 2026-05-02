import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import GraphPage from './pages/GraphPage.jsx';

const BASENAME = '/depGraph';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <HomePage />
    },
    {
      path: '/graph',
      element: <GraphPage />
    }
  ],
  {
    basename: BASENAME
  }
);

export default function App() {
  return <RouterProvider router={router} />;
}

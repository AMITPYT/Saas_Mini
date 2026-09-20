import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useEffect } from 'react';
import { useUIStore } from './store/uiStore';
import { OfflineIndicator } from './components/common';
import { useAuthCheck } from './hooks/useAuth';

function App() {
  const { theme } = useUIStore();
  useAuthCheck();

  // Apply theme on mount and when it changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  return (
    <>
      <RouterProvider router={router} />
      <OfflineIndicator />
    </>
  );
}

export default App;

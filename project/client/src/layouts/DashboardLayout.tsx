import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { useUIStore } from '../store/uiStore';
import { CommandPalette } from '../components/common/CommandPalette';

export const DashboardLayout: React.FC = () => {
  const { sidebarOpen, sidebarCollapsed, commandPaletteOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Command Palette */}
      {commandPaletteOpen && <CommandPalette />}

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen
            ? sidebarCollapsed
              ? 'lg:pl-16'
              : 'lg:pl-64'
            : ''
        }`}
      >
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

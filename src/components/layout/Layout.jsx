import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ImpersonateBanner from '../admin/ImpersonateBanner';
import ParticleBackground from '../ui/ParticleBackground';

export default function Layout() {
  return (
    <div className="flex flex-col h-screen relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <ParticleBackground />
      <div className="relative flex flex-col h-full" style={{ zIndex: 1 }}>
        <ImpersonateBanner />
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center max-w-sm fade-in">
        <p className="text-6xl font-bold mb-4 font-mono" style={{ color: 'var(--border-default)' }}>404</p>
        <h1 className="text-[18px] font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Page not found</h1>
        <p className="text-[13px] mb-6" style={{ color: 'var(--text-hint)' }}>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

import { SiteHeader } from './components/SiteHeader';
import { Marketplace } from './pages/Marketplace';
import { PropertyDetail } from './pages/PropertyDetail';
import { Dashboard } from './pages/Dashboard';
import { Wallet } from './pages/Wallet';
import { Checkout } from './pages/Checkout';

export default function App() {
  const path = window.location.pathname;
  const checkoutMatch = path.match(/^\/investor\/invest\/([^/]+)/);
  const match = window.location.pathname.match(/^\/properties\/([^/]+)/);
  const page = checkoutMatch
    ? <Checkout id={checkoutMatch[1]} />
    : path === '/dashboard' || path === '/portfolio'
      ? <Dashboard />
      : path === '/wallet'
        ? <Wallet />
        : match
          ? <PropertyDetail id={match[1]} />
          : <Marketplace />;

  return <div className="min-h-screen bg-mist text-ink"><SiteHeader />{page}</div>;
}

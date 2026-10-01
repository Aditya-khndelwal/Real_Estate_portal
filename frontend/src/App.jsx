import { SiteHeader } from './components/SiteHeader';
import { Marketplace } from './pages/Marketplace';
import { PropertyDetail } from './pages/PropertyDetail';
import { Dashboard } from './pages/Dashboard';
import { Wallet } from './pages/Wallet';
import { Checkout } from './pages/Checkout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProperties } from './pages/admin/AdminProperties';
import { AdminUsers } from './pages/admin/AdminUsers';
import { BrokerDashboard } from './pages/broker/BrokerDashboard';
import { BrokerProperties } from './pages/broker/BrokerProperties';
import { BrokerListingWizard } from './pages/broker/BrokerListingWizard';

export default function App() {
  const path = window.location.pathname;

  // Admin routes (no SiteHeader — uses PanelLayout with sidebar)
  if (path === '/admin/dashboard') return <AdminDashboard />;
  if (path === '/admin/properties') return <AdminProperties />;
  if (path === '/admin/users') return <AdminUsers />;

  // Broker routes (no SiteHeader — uses PanelLayout with sidebar)
  if (path === '/broker/dashboard') return <BrokerDashboard />;
  if (path === '/broker/properties/new') return <BrokerListingWizard />;
  if (path === '/broker/properties') return <BrokerProperties />;

  // Investor / public routes
  const checkoutMatch = path.match(/^\/investor\/invest\/([^/]+)/);
  const propertyMatch = path.match(/^\/properties\/([^/]+)/);

  const page = checkoutMatch
    ? <Checkout id={checkoutMatch[1]} />
    : path === '/dashboard' || path === '/portfolio'
      ? <Dashboard />
      : path === '/wallet'
        ? <Wallet />
        : propertyMatch
          ? <PropertyDetail id={propertyMatch[1]} />
          : <Marketplace />;

  return <div className="min-h-screen bg-mist text-ink"><SiteHeader />{page}</div>;
}

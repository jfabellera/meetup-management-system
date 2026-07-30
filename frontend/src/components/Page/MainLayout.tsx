import { useEffect, useState, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { mainSidebarItems } from '../Sidebar/navItems';
import Page from './Page';

/**
 * Shared chrome for the main pages. Rendered once as a layout route so the
 * navbar and sidebar survive navigation; only the outlet content swaps.
 */
const MainLayout = (): ReactNode => {
  const { pathname } = useLocation();
  const derived = pathname.startsWith('/map') ? 'map' : 'home';
  const [sidebarValue, setSidebarValue] = useState(derived);
  useEffect(() => {
    setSidebarValue(derived);
  }, [derived]);

  return (
    <Page
      sidebarItems={mainSidebarItems}
      sidebarValue={sidebarValue}
      setSidebarValue={setSidebarValue}
      mobileMenu
    >
      <Outlet />
    </Page>
  );
};

export default MainLayout;

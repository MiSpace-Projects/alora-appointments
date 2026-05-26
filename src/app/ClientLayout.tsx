'use client';

import Footer from './components/footer/Footer';
import Navbar from './components/navbar/Navbar';
import { usePathname } from 'next/navigation';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];
function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default ClientLayout;

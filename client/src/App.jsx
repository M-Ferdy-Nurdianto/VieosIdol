import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

const Home = lazy(() => import('./pages/Home'));
const Members = lazy(() => import('./pages/Members'));
const MemberDetail = lazy(() => import('./pages/MemberDetail'));
const Music = lazy(() => import('./pages/Music'));
const Cheki = lazy(() => import('./pages/Cheki'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Admin = lazy(() => import('./pages/admin/Admin'));
const Login = lazy(() => import('./pages/Login'));

const RouteLoader = () => (
  <div className="min-h-[45vh] flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-vibrant-pink/20 border-t-vibrant-pink rounded-full animate-spin" />
  </div>
);

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin') || location.pathname === '/login';

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  React.useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (reduceMotion || !isDesktop) return undefined;

    let isMounted = true;
    let aosInstance = null;

    (async () => {
      await import('aos/dist/aos.css');
      const { default: AOS } = await import('aos');
      if (!isMounted) return;
      aosInstance = AOS;
      AOS.init({
        duration: 700,
        once: true,
        mirror: false,
        offset: 40
      });
    })();

    return () => {
      isMounted = false;
      if (aosInstance && typeof aosInstance.refreshHard === 'function') {
        aosInstance.refreshHard();
      }
    };
  }, []);

  return (
    <div className="App selection:bg-gold/30 overflow-x-hidden">
      {/* Grainy Texture Overlay */}
      <div className="grain-overlay" />
      
      {!isAdmin && <Navbar />}
      
      
      <main>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/music" element={<Music />} />
            <Route path="/cheki" element={<Cheki />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<MemberDetail />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Suspense>
      </main>
      
    </div>
  );
}


export default App;

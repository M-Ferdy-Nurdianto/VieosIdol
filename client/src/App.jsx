import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import Music from './pages/Music';
import Cheki from './pages/Cheki';
import Checkout from './pages/Checkout';
import Admin from './pages/admin/Admin';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
import { Helmet } from 'react-helmet-async';
import AOS from 'aos';
import 'aos/dist/aos.css';

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin') || location.pathname === '/login';

  React.useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true
    });
  }, []);

  return (
    <div className="App selection:bg-gold/30">
      {/* Grainy Texture Overlay */}
      <div className="grain-overlay" />
      
      {!isAdmin && <Navbar />}
      
      
      <main>
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
      </main>
      
    </div>
  );
}


export default App;

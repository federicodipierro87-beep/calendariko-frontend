import React, { useState, useEffect } from 'react';
import SimpleLogin from './pages/SimpleLogin';
import Dashboard from './pages/Dashboard';
import EmailVerification from './components/EmailVerification';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'login' | 'verify' | 'dashboard'>('login');

  useEffect(() => {
    // Debug logging
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Search params:', window.location.search);
    
    // Controlla se stiamo visualizzando una pagina di verifica email
    const urlParams = new URLSearchParams(window.location.search);
    const verifyToken = urlParams.get('token');
    const email = urlParams.get('email');
    
    console.log('🔍 Token found:', !!verifyToken);
    console.log('🔍 Email found:', !!email);
    
    if (verifyToken) {
      console.log('✅ Setting view to verify');
      setCurrentView('verify');
      setLoading(false);
      return;
    }

    // Controlla se l'utente è già loggato
    const savedUserData = localStorage.getItem('userData');
    const accessToken = localStorage.getItem('accessToken');
    
    if (savedUserData && accessToken) {
      try {
        const parsedUser = JSON.parse(savedUserData);
        setUser(parsedUser);
        setCurrentView('dashboard');
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.clear();
        setCurrentView('login');
      }
    } else {
      setCurrentView('login');
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData: any, accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleVerificationComplete = () => {
    // Pulisce l'URL e torna al login
    window.history.replaceState({}, document.title, window.location.pathname);
    setCurrentView('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900">🎵 Calendariko</div>
          <div className="text-gray-600 mt-2">Caricamento...</div>
        </div>
      </div>
    );
  }

  if (currentView === 'verify') {
    return <EmailVerification onVerificationComplete={handleVerificationComplete} />;
  }

  if (currentView === 'login' || !user) {
    return <SimpleLogin onLogin={handleLogin} />;
  }

  return <Dashboard user={user} />;
}

export default App;

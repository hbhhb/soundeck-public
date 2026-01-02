import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SoundboardApp } from './components/SoundboardApp';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { Footer } from './components/Footer';
import { Toaster } from 'sonner@2.0.3';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { initGA } from './utils/analytics';

// Initialize GA immediately when App loads
initGA();

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable browser's default scroll restoration to prevent conflicts
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground-primary">
      <AnalyticsTracker />
      <ScrollToTop />
      <div className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<SoundboardApp />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
      </div>
      <Footer />
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView, initGA } from '../utils/analytics';

export const AnalyticsTracker = () => {
  const location = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initGA();
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    logPageView();
  }, [location]);

  return null;
};

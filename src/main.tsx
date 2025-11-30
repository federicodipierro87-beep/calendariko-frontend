import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global error handlers to prevent undefined alerts
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Prevent default alert behavior for undefined/CSP errors
  if (event.message && (event.message.includes('undefined') || event.message.includes('Content Security Policy'))) {
    event.preventDefault();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent default alert behavior
  event.preventDefault();
});

// Override alert function to filter undefined messages
const originalAlert = window.alert;
window.alert = function(message: any) {
  // Only show meaningful alerts, filter out undefined/empty messages
  if (message === undefined || message === 'undefined' || message === null || message === '') {
    console.warn('Filtered undefined alert:', message);
    return;
  }
  originalAlert(message);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

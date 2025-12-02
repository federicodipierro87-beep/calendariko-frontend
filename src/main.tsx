import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global error handlers to prevent undefined alerts
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Prevent default alert behavior for undefined/CSP/reCAPTCHA errors
  if (event.message && (
    event.message.includes('undefined') || 
    event.message.includes('Content Security Policy') ||
    event.filename?.includes('recaptcha') ||
    event.filename?.includes('gstatic.com')
  )) {
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
  // Log all alert attempts with stack trace for debugging
  console.log('🚨 Alert called with:', { message, type: typeof message });
  console.trace('Alert stack trace:');
  
  // Only show meaningful alerts, filter out undefined/empty/reCAPTCHA messages
  if (message === undefined || 
      message === 'undefined' || 
      message === null || 
      message === '' ||
      message === '✅ undefined' ||
      message === '❌ undefined' ||
      (typeof message === 'string' && message.includes('recaptcha'))) {
    console.warn('🚫 Filtered undefined/recaptcha alert:', message);
    return;
  }
  
  // Convert non-string messages to string
  const alertMessage = String(message);
  console.log('✅ Showing alert:', alertMessage);
  originalAlert(alertMessage);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

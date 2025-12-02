import React, { useState, useEffect } from 'react';
import { authApi } from '../utils/api';

interface EmailVerificationProps {
  onVerificationComplete: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ onVerificationComplete }) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userEmail = urlParams.get('email');
    
    if (userEmail) {
      setEmail(userEmail);
    }

    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Token di verifica mancante.');
    }
  }, []);

  const verifyEmail = async (token: string) => {
    try {
      setStatus('verifying');
      const response = await authApi.verifyEmail(token);
      
      if (response.success) {
        setStatus('success');
        setMessage(response.message || 'Email verificata con successo! Ora puoi accedere.');
        
        // Attendi 3 secondi e poi torna al login
        setTimeout(() => {
          onVerificationComplete();
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.message || 'Errore durante la verifica.');
      }
    } catch (error: any) {
      console.error('Errore verifica email:', error);
      
      if (error.message && error.message.includes('expired')) {
        setStatus('expired');
        setMessage('Il link di verifica è scaduto. Richiedi una nuova verifica.');
      } else {
        setStatus('error');
        setMessage(error.message || 'Errore durante la verifica email.');
      }
    }
  };

  const resendVerification = async () => {
    if (!email) {
      alert('Email non disponibile per l\'invio.');
      return;
    }

    try {
      await authApi.resendVerification(email);
      alert('✅ Nuovo link di verifica inviato! Controlla la tua email.');
    } catch (error: any) {
      alert(`❌ Errore nell'invio: ${error.message}`);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'expired':
        return '⏰';
      default:
        return '📧';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'verifying':
        return 'text-blue-600 bg-blue-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'expired':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            🎵 Calendariko
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Verifica Email
          </p>
        </div>

        <div className={`rounded-lg p-6 ${getStatusColor()}`}>
          <div className="text-center">
            <div className="text-4xl mb-4">
              {getStatusIcon()}
            </div>
            
            <h3 className="text-lg font-medium mb-2">
              {status === 'verifying' && 'Verifica in corso...'}
              {status === 'success' && 'Email Verificata!'}
              {status === 'error' && 'Verifica Fallita'}
              {status === 'expired' && 'Link Scaduto'}
            </h3>
            
            <p className="text-sm mb-4">
              {message}
            </p>

            {status === 'success' && (
              <div className="mt-4">
                <p className="text-sm">
                  Verrai reindirizzato al login tra pochi secondi...
                </p>
                <button
                  onClick={onVerificationComplete}
                  className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Vai al Login
                </button>
              </div>
            )}

            {(status === 'error' || status === 'expired') && (
              <div className="mt-4 space-y-3">
                {email && (
                  <button
                    onClick={resendVerification}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    📧 Invia Nuovo Link
                  </button>
                )}
                
                <button
                  onClick={onVerificationComplete}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Torna al Login
                </button>
              </div>
            )}

            {status === 'verifying' && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            )}
          </div>
        </div>

        {email && (
          <div className="text-center text-sm text-gray-600">
            Email: <span className="font-medium">{email}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
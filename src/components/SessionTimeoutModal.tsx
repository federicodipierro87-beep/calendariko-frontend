import React, { useEffect, useState } from 'react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
  remainingMinutes: number; // Actually seconds now, keeping name for compatibility
}

const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  onExtend,
  onLogout,
  remainingMinutes
}) => {
  // remainingMinutes is actually in seconds now
  const remainingSeconds = remainingMinutes;

  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ⏰ Sessione in scadenza
          </h3>
          
          {/* Message */}
          <p className="text-sm text-gray-500 mb-4">
            La tua sessione scadrà a breve per inattività.
          </p>

          {/* Countdown */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-lg font-bold text-red-700">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
            <p className="text-xs text-red-600">
              Tempo rimanente
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onExtend}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              🔄 Estendi Sessione
            </button>
            <button
              onClick={onLogout}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors font-medium"
            >
              🚪 Esci Ora
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            La sessione verrà estesa automaticamente se continui a utilizzare l'app
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;
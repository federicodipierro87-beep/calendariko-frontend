import { useEffect, useRef, useCallback } from 'react';

interface UseSessionTimeoutProps {
  onTimeout: () => void;
  timeoutMinutes?: number;
  warningMinutes?: number;
  onWarning?: () => void;
}

export const useSessionTimeout = ({
  onTimeout,
  timeoutMinutes = 30, // 30 minuti di default
  warningMinutes = 5,  // Avviso 5 minuti prima
  onWarning
}: UseSessionTimeoutProps) => {
  const timeoutRef = useRef<number>(0);
  const warningRef = useRef<number>(0);
  const lastActivityRef = useRef<number>(Date.now());

  // Reset del timer di inattività
  const resetTimer = useCallback(() => {
    // Solo log in development
    if (import.meta.env.DEV) {
      console.log('🔄 Session timeout reset');
    }
    lastActivityRef.current = Date.now();

    // Pulisce i timer esistenti
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      window.clearTimeout(warningRef.current);
    }

    // Imposta il timer di avviso
    if (onWarning && warningMinutes > 0) {
      const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
      warningRef.current = window.setTimeout(() => {
        if (import.meta.env.DEV) {
          console.log('⚠️ Session timeout warning');
        }
        onWarning();
      }, warningTime);
    }

    // Imposta il timer principale
    timeoutRef.current = window.setTimeout(() => {
      if (import.meta.env.DEV) {
        console.log('⏰ Session timeout - logging out');
      }
      onTimeout();
    }, timeoutMinutes * 60 * 1000);
  }, [onTimeout, onWarning, timeoutMinutes, warningMinutes]);

  // Eventi che indicano attività dell'utente
  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    // Reset solo se è passato più di 2 minuti dall'ultima attività
    // per evitare reset troppo frequenti durante il caricamento iniziale
    if (now - lastActivityRef.current > 120000) {
      resetTimer();
    }
  }, [resetTimer]);

  // Imposta i listener per gli eventi di attività
  useEffect(() => {
    // Eventi che indicano attività dell'utente
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle per mousemove per evitare troppi reset
    let mouseMoveTimeout: number;
    const handleMouseMove = () => {
      if (mouseMoveTimeout) return;
      mouseMoveTimeout = window.setTimeout(() => {
        handleUserActivity();
        mouseMoveTimeout = 0;
      }, 5000); // Throttle mousemove ogni 5 secondi
    };

    const handleOtherEvents = () => {
      handleUserActivity();
    };

    // Aggiungi event listeners
    events.forEach(event => {
      if (event === 'mousemove') {
        document.addEventListener(event, handleMouseMove, true);
      } else {
        document.addEventListener(event, handleOtherEvents, true);
      }
    });

    // Inizializza il timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        if (event === 'mousemove') {
          document.removeEventListener(event, handleMouseMove, true);
        } else {
          document.removeEventListener(event, handleOtherEvents, true);
        }
      });

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        window.clearTimeout(warningRef.current);
      }
      if (mouseMoveTimeout) {
        window.clearTimeout(mouseMoveTimeout);
      }
    };
  }, [handleUserActivity, resetTimer]);

  // Restituisce funzione per reset manuale
  return {
    resetTimer,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = (timeoutMinutes * 60 * 1000) - elapsed;
      return Math.max(0, Math.floor(remaining / 1000)); // in secondi
    }
  };
};
import React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface ReCaptchaProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
  size?: 'compact' | 'normal';
  theme?: 'light' | 'dark';
}

// Chiave pubblica di test reCAPTCHA (sostituire con quella reale)
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

console.log('🔍 reCAPTCHA Site Key:', RECAPTCHA_SITE_KEY);
console.log('🔍 Environment variables:', import.meta.env);

const ReCaptcha: React.FC<ReCaptchaProps> = ({
  onVerify,
  onExpired,
  onError,
  size = 'normal',
  theme = 'light'
}) => {
  console.log('🔍 ReCaptcha component rendered with sitekey:', RECAPTCHA_SITE_KEY);
  
  return (
    <div className="flex justify-center my-4">
      <div className="border-2 border-dashed border-blue-300 p-4 bg-blue-50 rounded">
        <p className="text-blue-700 text-sm mb-2 text-center">reCAPTCHA Component</p>
        <ReCAPTCHA
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={onVerify}
          onExpired={onExpired}
          onErrored={onError}
          size={size}
          theme={theme}
        />
      </div>
    </div>
  );
};

export default ReCaptcha;
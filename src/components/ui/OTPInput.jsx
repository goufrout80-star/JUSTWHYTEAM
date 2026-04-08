import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * OTPInput — 6-box individual digit input
 * Features: auto-advance, backspace, paste, shake on error, mint on success, resend cooldown
 */
export default function OTPInput({
  length = 6,
  onComplete,
  onResend,
  error = false,
  success = false,
  disabled = false,
  resendCooldown = 60,
  className = '',
}) {
  const [digits, setDigits] = useState(Array(length).fill(''));
  const [shaking, setShaking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);
  const cooldownRef = useRef(null);

  useEffect(() => {
    if (error && digits.some(d => d !== '')) {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }
  }, [error]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(resendCooldown);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleResend() {
    if (cooldown > 0) return;
    setDigits(Array(length).fill(''));
    inputRefs.current[0]?.focus();
    startCooldown();
    onResend?.();
  }

  const handleChange = useCallback((index, value) => {
    const singleChar = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleChar;
    setDigits(newDigits);

    if (singleChar && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const filled = newDigits.every(d => d !== '');
    if (filled) {
      onComplete?.(newDigits.join(''));
    }
  }, [digits, length, onComplete]);

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...digits];
      if (digits[index]) {
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const newDigits = Array(length).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    const nextEmpty = pasted.length < length ? pasted.length : length - 1;
    inputRefs.current[nextEmpty]?.focus();
    if (pasted.length === length) {
      onComplete?.(pasted);
    }
  }

  function handleFocus(e) {
    e.target.select();
  }

  const boxState = success ? 'success' : error ? 'error' : 'default';

  const boxStyles = {
    default: {
      background: 'rgba(0,224,192,0.04)',
      border: '1px solid rgba(0,224,192,0.18)',
      color: '#E8F4F3',
    },
    error: {
      background: 'rgba(224,85,85,0.08)',
      border: '1px solid rgba(224,85,85,0.4)',
      color: '#E05555',
    },
    success: {
      background: 'rgba(0,224,192,0.12)',
      border: '1px solid rgba(0,224,192,0.5)',
      color: '#00E0C0',
    },
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <style>{`
        @keyframes otp-shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(6px); }
          45% { transform: translateX(-5px); }
          60% { transform: translateX(5px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        .otp-shake { animation: otp-shake 0.6s cubic-bezier(0.36,0.07,0.19,0.97); }
        .otp-box:focus {
          outline: none;
          border-color: rgba(0,224,192,0.6) !important;
          box-shadow: 0 0 0 3px rgba(0,224,192,0.12);
        }
        .otp-box { transition: border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, background 0.2s ease; }
      `}</style>

      <div
        className={`flex gap-2 justify-center ${shaking ? 'otp-shake' : ''}`}
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={el => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            className="otp-box w-11 h-14 text-center text-[22px] font-mono font-semibold rounded-xl"
            style={{
              ...boxStyles[boxState],
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              caretColor: '#00E0C0',
              opacity: disabled ? 0.6 : 1,
            }}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={handleFocus}
            autoComplete="one-time-code"
          />
        ))}

        {success && (
          <div className="flex items-center ml-2">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10" fill="rgba(0,224,192,0.15)" stroke="#00E0C0" strokeWidth="1.5"/>
              <path d="M7 11l3 3 5-5" stroke="#00E0C0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      {error && (
        <p className="text-center text-[12px]" style={{ color: '#E05555' }}>
          {typeof error === 'string' ? error : 'Invalid or expired code. Request a new one.'}
        </p>
      )}

      {onResend && (
        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="text-[12px] transition-colors"
            style={{
              color: cooldown > 0 ? 'var(--text-hint)' : 'var(--text-accent)',
              cursor: cooldown > 0 ? 'default' : 'pointer',
            }}
          >
            {cooldown > 0
              ? `Resend code (${cooldown}s)`
              : 'Resend code'}
          </button>
        </div>
      )}
    </div>
  );
}

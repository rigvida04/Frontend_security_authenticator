import { useRef, useCallback } from 'react';

/**
 * OtpInput — a row of individual digit inputs that behave as one field.
 *
 * Props:
 *   length   {number}   — number of digits (default 6)
 *   value    {string}   — current OTP string (controlled)
 *   onChange {Function} — called with the new OTP string whenever it changes
 *   hasError {boolean}  — applies error styles
 *   disabled {boolean}
 */
export default function OtpInput({ length = 6, value = '', onChange, hasError = false, disabled = false }) {
  const inputsRef = useRef([]);

  // Keep the refs array in sync with the length prop
  const setRef = (el, idx) => {
    inputsRef.current[idx] = el;
  };

  const handleKeyDown = useCallback((e, idx) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newVal = value.split('');
      if (newVal[idx]) {
        // Clear current cell
        newVal[idx] = '';
        onChange(newVal.join(''));
      } else if (idx > 0) {
        // Move back and clear previous cell
        newVal[idx - 1] = '';
        onChange(newVal.join(''));
        inputsRef.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  }, [value, onChange, length]);

  const handleChange = useCallback((e, idx) => {
    const raw = e.target.value.replace(/\D/g, ''); // digits only
    if (!raw) return;

    // Support paste: distribute characters across cells starting at idx
    const chars = raw.split('').slice(0, length - idx);
    const newVal = value.split('');
    chars.forEach((ch, i) => {
      newVal[idx + i] = ch;
    });
    // Pad to length
    while (newVal.length < length) newVal.push('');
    const next = newVal.join('').slice(0, length);
    onChange(next);

    // Move focus to the cell after the last inserted character
    const nextFocus = Math.min(idx + chars.length, length - 1);
    inputsRef.current[nextFocus]?.focus();
  }, [value, onChange, length]);

  const handleFocus = (e) => {
    e.target.select();
  };

  const handlePaste = useCallback((e, idx) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length - idx);
    if (!pasted) return;
    const newVal = value.split('');
    pasted.split('').forEach((ch, i) => {
      newVal[idx + i] = ch;
    });
    while (newVal.length < length) newVal.push('');
    const next = newVal.join('').slice(0, length);
    onChange(next);
    const nextFocus = Math.min(idx + pasted.length, length - 1);
    inputsRef.current[nextFocus]?.focus();
  }, [value, onChange, length]);

  return (
    <div className="otp-container" role="group" aria-label="One-time password input">
      {Array.from({ length }).map((_, idx) => {
        const digit = value[idx] || '';
        const classes = [
          'otp-cell',
          digit ? 'filled' : '',
          hasError ? 'error' : '',
        ].filter(Boolean).join(' ');

        return (
          <input
            key={idx}
            ref={(el) => setRef(el, idx)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            className={classes}
            aria-label={`Digit ${idx + 1}`}
            disabled={disabled}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onFocus={handleFocus}
            onPaste={(e) => handlePaste(e, idx)}
            autoComplete="one-time-code"
          />
        );
      })}
    </div>
  );
}

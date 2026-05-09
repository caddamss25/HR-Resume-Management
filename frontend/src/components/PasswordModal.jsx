import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function PasswordModal({ isOpen, onClose, onSubmit, title = "Authentication Required", message = "Please enter your password to confirm this sensitive operation.", confirmText = "Confirm" }) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setSubmitting(false);
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    try {
      await onSubmit(password);
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'var(--rms-card-bg)',
        border: '1px solid var(--rms-border)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        borderRadius: '16px',
        width: '90%', maxWidth: '420px',
        padding: '32px',
        animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Top Accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #ef4444, #f59e0b)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', flexShrink: 0
          }}>
            <i className="bi bi-shield-lock-fill" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--rms-text)' }}>
            {title}
          </h2>
        </div>

        <p style={{ color: 'var(--rms-text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
          {message}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <i className="bi bi-key-fill" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--rms-text-muted)', fontSize: '1.1rem' }} />
            <input
              type="password"
              className="rms-input w-100"
              placeholder="Your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '42px', paddingRight: '16px', height: '48px', fontSize: '1rem', letterSpacing: '0.1em' }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn-rms-outline"
              onClick={onClose}
              disabled={submitting}
              style={{ padding: '10px 20px', borderRadius: '8px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-rms-danger"
              disabled={submitting || !password}
              style={{ padding: '10px 24px', borderRadius: '8px', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}
            >
              {submitting ? (
                <><span className="spinner-border spinner-border-sm me-2" />Verifying...</>
              ) : (
                <><i className="bi bi-check-circle-fill" /> {confirmText}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Use portal so it overlays everything
  return createPortal(modalContent, document.body);
}

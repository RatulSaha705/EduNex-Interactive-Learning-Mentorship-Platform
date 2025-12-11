// src/components/ConfirmModal.js

import React from 'react';
import './ConfirmModal.css';

/**
 * Props:
 * - isOpen: boolean — whether modal is visible  
 * - title: string — title text  
 * - message: string (or React node) — message / body  
 * - onConfirm: function — called when user confirms  
 * - onCancel: function — called when user cancels or closes  
 * - confirmText: string — (optional) text for confirm button, default 'Yes'  
 * - cancelText: string — (optional) text for cancel button, default 'Cancel'  
 * - className: extra CSS class for modal content (optional)  
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes',
  cancelText = 'Cancel',
  className = ''
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-modal-backdrop" onClick={onCancel}>
      <div
        className={`confirm-modal-content ${className}`}
        onClick={e => e.stopPropagation()}
      >
        { title && <h2 className="confirm-modal-title">{title}</h2> }
        <div className="confirm-modal-body">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        <div className="confirm-modal-actions">
          <button
            className="confirm-modal-btn cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className="confirm-modal-btn confirm"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

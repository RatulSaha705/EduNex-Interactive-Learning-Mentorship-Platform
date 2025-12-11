// src/components/Button.js

import React from 'react';
import './Button.css';

export default function Button({
  children,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  style = {},
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn ${className}`}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}

// src/components/Input.js

import React from 'react';
import './Input.css';

export default function Input({
  label,
  value,
  onChange,
  type = 'text',
  name,
  placeholder = '',
  className = '',
  style = {},
  ...props
}) {
  return (
    <div className={`input-group ${className}`} style={style}>
      {label && <label className="input-label" htmlFor={name}>{label}</label>}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-field"
        {...props}
      />
    </div>
  );
}

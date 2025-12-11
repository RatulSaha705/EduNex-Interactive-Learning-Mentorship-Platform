// src/components/Textarea.js

import React from 'react';
import './Textarea.css';

export default function Textarea({
  label,
  value,
  onChange,
  name,
  placeholder = '',
  rows = 4,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div className={`textarea-group ${className}`} style={style}>
      {label && (
        <label className="textarea-label" htmlFor={name}>
          {label}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="textarea-field"
        {...props}
      />
    </div>
  );
}

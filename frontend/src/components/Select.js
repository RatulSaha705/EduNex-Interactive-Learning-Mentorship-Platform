// src/components/Select.js

import React, { useState, useRef, useEffect } from 'react';
import './Select.css';

export default function Select({
  options = [],           // array of { value, label }
  value = '',
  onChange = () => {},
  placeholder = 'Select...',
  className = '',
  style = {},
  name = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const wrapperRef = useRef(null);

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
  };

  const handleOptionClick = (opt) => {
    setSelectedValue(opt.value);
    onChange(opt.value);
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedLabel = options.find(opt => opt.value === selectedValue)?.label || '';

  return (
    <div className={`select-wrapper ${className}`} style={style} ref={wrapperRef}>
      <button type="button" className="select-header" onClick={toggleOpen}>
        {selectedLabel || placeholder}
        <span className="select-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <ul className="select-options">
          {options.map(opt => (
            <li
              key={opt.value}
              className="select-option"
              onClick={() => handleOptionClick(opt)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
      {/* Hidden native select for form compatibility */}
      {name && (
        <select
          name={name}
          value={selectedValue}
          onChange={(e) => onChange(e.target.value)}
          hidden
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

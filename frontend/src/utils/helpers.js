// src/utils/helpers.js

/**
 * Convert an array of objects into an object keyed by a specific field.
 * Example:
 *   const list = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
 *   const mapById = arrayToObject(list, 'id');
 *   // { '1': {id:1, name:'A'}, '2': {id:2, name:'B'} }
 */
export function arrayToObject(array, keyField = 'id') {
  if (!Array.isArray(array)) {
    console.warn('arrayToObject: first argument is not an array', array);
    return {};
  }
  return array.reduce((obj, item) => {
    if (item && item[keyField] !== undefined) {
      obj[item[keyField]] = item;
    }
    return obj;
  }, {});
}

/**
 * Format a Date (or date‑string / timestamp) into a readable string: YYYY-MM-DD hh:mm
 */
export function formatDate(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) {
    return '';
  }
  const pad = (n) => String(n).padStart(2, '0');
  const YYYY = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const DD = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${YYYY}-${MM}-${DD} ${hh}:${mm}`;
}

/**
 * Capitalize first letter of a string (if string)
 */
export function capitalize(str) {
  if (typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

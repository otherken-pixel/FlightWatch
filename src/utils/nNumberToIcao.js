// ==UserScript==
// @name         FlightWatch N-Number to ICAO24 Auto-Fill
// @match        *://flightwatch-7fb60.firebaseapp.com/*
// @match        *://localhost:*/*
// ==/UserScript==

/**
 * Converts a US aircraft tail number (N-number) to its ICAO24 hex code
 * using the FAA's mathematical encoding, then auto-fills the form.
 *
 * Usage:
 *   - Tampermonkey: install as userscript
 *   - Bookmarklet: wrap in javascript:void((function(){...})())
 *   - Inline: import and call initNNumberAutoFill()
 *
 * Algorithm reference:
 *   US ICAO24 addresses run from A00001 (N1) through the A-block.
 *   The encoding is a mixed-radix hierarchical scheme where each block
 *   reserves slots for: (1) bare termination, (2) letter suffixes, then
 *   (3) digit sub-blocks. Block sizes per level:
 *     Level 1 (after d1): 101711 = 1 + 600 + 10×10111
 *     Level 2 (after d2):  10111 = 1 + 600 + 10×951
 *     Level 3 (after d3):    951 = 1 + 600 + 10×35
 *     Level 4 (after d4):     35 = 1 + 24  + 10×1
 */

// Valid suffix letters: A-Z excluding I and O = 24 letters
const SUFFIX_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const ICAO_BASE = 0xA00001;

function letterIndex(ch) {
  return SUFFIX_ALPHABET.indexOf(ch.toUpperCase());
}

/**
 * Suffix offset for 0-2 trailing letters (after 1-3 digits).
 * Each first letter L1 owns a sub-block of 25: bare L1 + 24 second letters.
 *   ''   → 0
 *   'A'  → 1
 *   'AA' → 2  ... 'AZ'(excl I,O) → 25
 *   'B'  → 26  ...  'ZZ' → 600
 */
function suffixOffset2(letters) {
  if (letters.length === 0) return 0;
  if (letters.length === 1) return 1 + letterIndex(letters[0]) * 25;
  return 1 + letterIndex(letters[0]) * 25 + 1 + letterIndex(letters[1]);
}

/**
 * Suffix offset for 0-1 trailing letter (after 4 digits).
 *   ''  → 0
 *   'A' → 1  ...  'Z'(excl I,O) → 24
 */
function suffixOffset1(letter) {
  if (!letter) return 0;
  return 1 + letterIndex(letter);
}

/**
 * Convert a US N-number to its 6-character ICAO24 hex code.
 * Returns lowercase hex string or null if invalid.
 */
export function nNumberToIcao24(nNumber) {
  const raw = nNumber.toUpperCase().replace(/^N/, '');
  if (!raw || raw.length > 5) return null;

  const match = raw.match(/^(\d{1,5})([A-HJ-NP-Z]{0,2})$/);
  if (!match) return null;

  const digits = match[1];
  const letters = match[2] || '';

  if (digits.length + letters.length > 5) return null;
  if (digits.length >= 5 && letters.length > 0) return null;
  if (digits.length === 4 && letters.length > 1) return null;

  const d = digits.split('').map(Number);
  if (d[0] < 1) return null;

  // Start with the first-digit block (d1 is 1-9, so index d1-1)
  let offset = (d[0] - 1) * 101711;

  // Each subsequent digit skips past the bare + suffix slots at that level,
  // then indexes into the digit sub-blocks.
  //
  // Levels 1-3: overhead = 1 (bare) + 600 (suffix) = 601
  // Level 4:    overhead = 1 (bare) + 24 (suffix)  = 25

  if (d.length >= 2) offset += 601 + d[1] * 10111;
  if (d.length >= 3) offset += 601 + d[2] * 951;
  if (d.length >= 4) offset += 601 + d[3] * 35;
  if (d.length >= 5) offset += 25 + d[4];

  // Add suffix letter offset at the terminating level
  if (d.length <= 3) {
    offset += suffixOffset2(letters);
  } else if (d.length === 4) {
    offset += suffixOffset1(letters[0]);
  }
  // 5 digits: no suffix possible

  return (ICAO_BASE + offset).toString(16).padStart(6, '0');
}

/**
 * Validate a US N-number format.
 * Starts with N, followed by 1-5 alphanumeric chars: leading digits (first 1-9),
 * then optional 0-2 trailing letters (excluding I and O).
 */
export function isValidNNumber(value) {
  return /^N[1-9]\d{0,4}[A-HJ-NP-Z]{0,2}$/i.test(value) &&
    value.replace(/^N/i, '').length >= 1 &&
    value.replace(/^N/i, '').length <= 5;
}

/**
 * Find an input field by its label text in the DOM.
 */
function findInputByLabel(labelText) {
  for (const label of document.querySelectorAll('label')) {
    const span = label.querySelector('span');
    if (span && span.textContent.trim().toUpperCase().includes(labelText.toUpperCase())) {
      return label.querySelector('input');
    }
  }
  // Fallback: search by placeholder
  for (const input of document.querySelectorAll('input[type="text"], input:not([type])')) {
    if (input.placeholder && input.placeholder.toLowerCase().includes(labelText.toLowerCase())) {
      return input;
    }
  }
  return null;
}

/**
 * Set a value on a React-controlled input and fire the events
 * that React / Vue / vanilla JS forms listen on.
 */
function setNativeValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  )?.set;

  if (setter) {
    setter.call(input, value);
  } else {
    input.value = value;
  }

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Initialize the auto-fill behavior.
 * Uses a MutationObserver to detect dynamically rendered modals/forms,
 * then attaches listeners on the Tail Number input to auto-fill ICAO24.
 */
export function initNNumberAutoFill() {
  let attached = false;

  function tryAttach() {
    const tailInput = findInputByLabel('Tail Number');
    const icaoInput = findInputByLabel('ICAO24') || findInputByLabel('Hex Code');
    if (!tailInput || !icaoInput || attached) return;
    attached = true;

    function convert() {
      const val = tailInput.value.trim();
      if (!val || !isValidNNumber(val)) return;
      const hex = nNumberToIcao24(val);
      if (hex) setNativeValue(icaoInput, hex);
    }

    tailInput.addEventListener('blur', convert);
    tailInput.addEventListener('input', () => {
      if (!tailInput.value) { attached = false; return; }
      if (tailInput.value.trim().length >= 3) convert();
    });
  }

  const observer = new MutationObserver(() => { if (!attached) tryAttach(); });
  observer.observe(document.body, { childList: true, subtree: true });
  tryAttach();

  return () => { observer.disconnect(); attached = false; };
}

// Auto-init for standalone use (Tampermonkey / bookmarklet)
if (typeof window !== 'undefined' && !window.__nNumberAutoFillInit) {
  window.__nNumberAutoFillInit = true;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNNumberAutoFill);
  } else {
    initNNumberAutoFill();
  }
}

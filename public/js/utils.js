/**
 * GTSearch Shared Utilities
 * Common functions used across all frontend pages
 * 
 * @module utils
 */

// ============================================================================
// XSS PROTECTION — escapeHTML
// ============================================================================

/**
 * Escape HTML special characters to prevent XSS injection.
 * Use this for ALL user-provided or external data before inserting into DOM via innerHTML.
 * 
 * @param {*} str - String to escape (non-strings are converted first)
 * @returns {string} HTML-safe string
 */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const s = String(str);
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return s.replace(/[&<>"']/g, c => map[c]);
}

/**
 * Sanitize a URL to prevent javascript: protocol injection.
 * Only allows http:, https:, and relative URLs.
 * 
 * @param {string} url - URL to sanitize
 * @returns {string} Safe URL or '#' if potentially dangerous
 */
function sanitizeURL(url) {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
        return '#';
    }
    return url;
}

/**
 * Format a dollar amount safely (no XSS, consistent formatting)
 * 
 * @param {number|string} amount - Dollar amount
 * @param {boolean} showCents - Whether to show cents (default false)
 * @returns {string} Formatted dollar string like "$45,000"
 */
function formatDollar(amount, showCents = false) {
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString('en-US', {
        minimumFractionDigits: showCents ? 2 : 0,
        maximumFractionDigits: showCents ? 2 : 0
    });
}

/**
 * Parse a dollar string like "$45,000.00" to a number
 * 
 * @param {string} str - Dollar string to parse
 * @returns {number} Parsed number or 0
 */
function parseDollarString(str) {
    if (!str || typeof str !== 'string') return 0;
    const cleaned = str.replace(/[$,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

/**
 * Debounce a function call
 * 
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.escapeHTML = escapeHTML;
    window.sanitizeURL = sanitizeURL;
    window.formatDollar = formatDollar;
    window.parseDollarString = parseDollarString;
    window.debounce = debounce;
}

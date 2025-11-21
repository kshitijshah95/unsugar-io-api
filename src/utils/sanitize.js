/**
 * Sanitize user input to prevent ReDoS and injection attacks
 */

/**
 * Escape special regex characters in user input
 * @param {string} input - User input string
 * @returns {string} - Sanitized string safe for regex
 */
const sanitizeRegexInput = (input) => {
  if (typeof input !== 'string') return '';
  // Escape special regex characters
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
};

/**
 * Sanitize and validate pagination parameters
 * @param {string|number} page - Page number
 * @param {string|number} limit - Items per page
 * @returns {object} - Validated pagination params
 */
const sanitizePagination = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(Math.max(1, parseInt(limit) || 10), 50);
  return { pageNum, limitNum };
};

/**
 * Sanitize sort parameters
 * @param {string} sort - Sort field
 * @param {string} order - Sort order
 * @returns {object} - Validated sort params
 */
const sanitizeSort = (sort, order) => {
  const allowedSortFields = ['title', 'publishedDate'];
  const allowedOrders = ['asc', 'desc'];
  
  const sortField = allowedSortFields.includes(sort) ? sort : 'publishedDate';
  const sortOrder = allowedOrders.includes(order) ? order : 'desc';
  
  return { sortField, sortOrder };
};

module.exports = {
  sanitizeRegexInput,
  sanitizePagination,
  sanitizeSort
};

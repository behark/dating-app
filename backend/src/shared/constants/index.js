/**
 * Backend Constants - Index
 * Re-exports all constants for easy importing
 */

const messages = require('./messages');
const apiRoutes = require('./apiRoutes');

module.exports = {
  ...messages,
  ...apiRoutes,
};

/**
 * Repository Pattern Exports
 *
 * Usage:
 *   import { getUserRepository } from '../repositories';
 *   const repo = getUserRepository();
 *   const users = await repo.getDiscoverableUsers(userId);
 */

export { ApiUserRepository, getApiUserRepository } from './ApiUserRepository';
export { UserRepository } from './UserRepository';

/**
 * Get the user repository instance
 * @param {string} [authToken] - Auth token for API repository
 * @returns {UserRepository} The configured repository instance
 */
export const getUserRepository = (authToken) => {
  const { getApiUserRepository } = require('./ApiUserRepository');
  return getApiUserRepository(authToken);
};

export default { getUserRepository };

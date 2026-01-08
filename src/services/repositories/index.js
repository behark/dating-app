/**
 * Repository Pattern Exports
 *
 * Use these repositories to decouple your UI from specific data sources.
 *
 * Usage:
 *   import { getUserRepository } from '../repositories';
 *   const repo = getUserRepository();
 *   const users = await repo.getDiscoverableUsers(userId);
 */

export { ApiUserRepository, getApiUserRepository } from './ApiUserRepository';
export { FirebaseUserRepository, getFirebaseUserRepository } from './FirebaseUserRepository';
export { UserRepository } from './UserRepository';

// Default repository - can be switched between Firebase and API
// Set USE_API_REPOSITORY to true to use the backend API instead of Firebase
const USE_API_REPOSITORY = true; // Change this to switch data sources

/**
 * Get the appropriate user repository based on configuration
 * @param {string} [authToken] - Auth token for API repository
 * @returns {UserRepository} The configured repository instance
 */
export const getUserRepository = (authToken) => {
  if (USE_API_REPOSITORY) {
    const { getApiUserRepository } = require('./ApiUserRepository');
    return getApiUserRepository(authToken);
  } else {
    const { getFirebaseUserRepository } = require('./FirebaseUserRepository');
    return getFirebaseUserRepository();
  }
};

export default { getUserRepository };

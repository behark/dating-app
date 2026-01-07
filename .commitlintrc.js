/**
 * Commitlint Configuration
 *
 * Enforces conventional commit messages
 * Format: <type>(<scope>): <subject>
 *
 * Examples:
 *   feat(auth): add Google OAuth login
 *   fix(swipe): resolve race condition in match creation
 *   refactor(cache): implement multi-layer caching
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of these
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation only changes
        'style', // Code style changes (formatting, missing semi-colons, etc)
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf', // Performance improvement
        'test', // Adding or updating tests
        'build', // Changes to build system or dependencies
        'ci', // Changes to CI configuration files and scripts
        'chore', // Other changes that don't modify src or test files
        'revert', // Revert a previous commit
      ],
    ],
    // Subject must not be empty
    'subject-empty': [2, 'never'],
    // Subject must not end with period
    'subject-full-stop': [2, 'never', '.'],
    // Subject must be lowercase
    'subject-case': [2, 'always', 'lower-case'],
    // Type must be lowercase
    'type-case': [2, 'always', 'lower-case'],
    // Header must not be longer than 100 characters
    'header-max-length': [2, 'always', 100],
  },
};

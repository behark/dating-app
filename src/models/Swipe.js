/**
 * Swipe Model
 * Represents a swipe action between two users
 */
export class Swipe {
  /**
   * Creates a new Swipe instance
   * @param {string} swiper - User ID of the person who swiped
   * @param {string} target - User ID of the person being swiped on
   * @param {string} type - Type of swipe: 'like' or 'dislike'
   * @param {Date} createdAt - Timestamp when the swipe was created
   */
  constructor(swiper, target, type, createdAt = null) {
    this.swiper = swiper;
    this.target = target;
    this.type = type; // 'like' or 'dislike'
    this.createdAt = createdAt || new Date();
  }

  /**
   * Converts Swipe instance to Firestore document format
   * @returns {Object} Firestore document data
   */
  toFirestore() {
    return {
      swiper: this.swiper,
      target: this.target,
      type: this.type,
      createdAt: this.createdAt,
    };
  }

  /**
   * Creates a Swipe instance from Firestore document
   * @param {string} id - Document ID
   * @param {Object} data - Firestore document data
   * @returns {Swipe} Swipe instance
   */
  static fromFirestore(id, data) {
    // Handle Firestore Timestamp conversion
    let createdAt = new Date();
    if (data.createdAt) {
      if (data.createdAt.toDate) {
        // Firestore Timestamp object
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt instanceof Date) {
        // Already a Date object
        createdAt = data.createdAt;
      } else if (typeof data.createdAt === 'number') {
        // Unix timestamp
        createdAt = new Date(data.createdAt);
      }
    }

    const swipe = new Swipe(
      data.swiper,
      data.target,
      data.type,
      createdAt
    );
    swipe.id = id;
    return swipe;
  }

  /**
   * Validates swipe data
   * @param {string} swiper - User ID of the swiper
   * @param {string} target - User ID of the target
   * @param {string} type - Type of swipe
   * @returns {Object} Validation result with isValid and error message
   */
  static validate(swiper, target, type) {
    if (!swiper || typeof swiper !== 'string') {
      return { isValid: false, error: 'Swiper ID is required and must be a string' };
    }
    if (!target || typeof target !== 'string') {
      return { isValid: false, error: 'Target ID is required and must be a string' };
    }
    if (swiper === target) {
      return { isValid: false, error: 'Swiper and target cannot be the same user' };
    }
    if (type !== 'like' && type !== 'dislike') {
      return { isValid: false, error: 'Type must be either "like" or "dislike"' };
    }
    return { isValid: true };
  }
}

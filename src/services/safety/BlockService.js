import logger from '../../utils/logger';
import api from '../api';

/**
 * Service for blocking/unblocking users
 */
export class BlockService {
    static async blockUser(blockedUserId) {
        try {
            const response = await api.post('/safety/block', { blockedUserId });

            if (!response.success) {
                logger.error('Error blocking user', new Error(response.message), { blockedUserId });
                return false;
            }

            logger.info('User blocked', { blockedUserId });
            return response.data || false;
        } catch (error) {
            logger.error('Error blocking user', error, { blockedUserId });
            return false;
        }
    }

    static async unblockUser(blockedUserId) {
        try {
            const response = await api.delete(`/safety/block/${blockedUserId}`);

            if (!response.success) {
                logger.error('Error unblocking user', new Error(response.message), { blockedUserId });
                return false;
            }

            logger.info('User unblocked', { blockedUserId });
            return true;
        } catch (error) {
            logger.error('Error unblocking user', error, { blockedUserId });
            return false;
        }
    }

    static async getBlockedUsers() {
        try {
            const response = await api.get('/safety/blocked');

            if (!response.success) {
                logger.error('Error getting blocked users', new Error(response.message));
                return [];
            }

            return response.blockedUsers || response.data?.blockedUsers || [];
        } catch (error) {
            logger.error('Error getting blocked users', error);
            return [];
        }
    }

    static async isUserBlocked(otherUserId) {
        try {
            const response = await api.get(`/safety/blocked/${otherUserId}`);

            if (!response.success) {
                logger.error('Error checking if user is blocked', new Error(response.message));
                return false;
            }

            return response.userHasBlocked || response.data?.userHasBlocked || false;
        } catch (error) {
            logger.error('Error checking if user is blocked', error, { otherUserId });
            return false;
        }
    }

    static async canInteractWith(targetUserId) {
        try {
            const response = await api.get(`/safety/blocked/${targetUserId}`);

            if (!response.success) {
                return { canInteract: true };
            }

            return {
                canInteract: response.canInteract ?? response.data?.canInteract ?? true,
                userHasBlocked: response.userHasBlocked || response.data?.userHasBlocked || false,
                blockedByOther: response.blockedByOther || response.data?.blockedByOther || false,
                reason: response.reason || response.data?.reason || null,
            };
        } catch (error) {
            logger.error('Error checking interaction status', error, { targetUserId });
            return { canInteract: true };
        }
    }
}

export default BlockService;

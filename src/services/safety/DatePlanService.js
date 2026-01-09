import logger from '../../utils/logger';
import api from '../api';

/**
 * Service for date plan sharing and management
 */
export class DatePlanService {
    static async shareDatePlan(datePlanData, friendIds = []) {
        try {
            const validation = this.validateDatePlan(datePlanData);
            if (!validation.isValid) {
                return { success: false, errors: validation.errors };
            }

            const response = await api.post('/safety/date-plan', {
                ...datePlanData,
                sharedWith: friendIds,
            });

            if (!response.success) {
                logger.error('Error sharing date plan', new Error(response.message));
                return { success: false, error: response.message };
            }

            return response.data || { success: true };
        } catch (error) {
            logger.error('Error sharing date plan', error);
            return { success: false, error: error.message };
        }
    }

    static async getActiveDatePlans() {
        try {
            const response = await api.get('/safety/date-plans/active');

            if (!response.success) {
                return [];
            }

            return response.data?.datePlans || [];
        } catch (error) {
            logger.error('Error getting active date plans', error);
            return [];
        }
    }

    static async getSharedDatePlans() {
        try {
            const response = await api.get('/safety/date-plans/shared');

            if (!response.success) {
                return [];
            }

            return response.data?.datePlans || [];
        } catch (error) {
            logger.error('Error getting shared date plans', error);
            return [];
        }
    }

    static async updateDatePlanStatus(datePlanId, status) {
        try {
            const response = await api.put(`/safety/date-plan/${datePlanId}`, { status });

            if (!response.success) {
                logger.error('Error updating date plan', new Error(response.message));
                return { success: false, error: response.message };
            }

            return response.data || { success: true };
        } catch (error) {
            logger.error('Error updating date plan', error);
            return { success: false, error: error.message };
        }
    }

    static validateDatePlan(datePlan) {
        const errors = [];

        if (!datePlan.matchName || datePlan.matchName.trim().length < 2) {
            errors.push('Match name must be at least 2 characters');
        }

        if (!datePlan.location || datePlan.location.trim().length < 5) {
            errors.push('Please provide a more specific location');
        }

        if (!datePlan.dateTime) {
            errors.push('Please select a date and time');
        } else {
            const dateTime = new Date(datePlan.dateTime);
            if (dateTime < new Date()) {
                errors.push('Date must be in the future');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

export default DatePlanService;

/**
 * Safety Services Barrel Export
 * 
 * Modular safety services split from the monolithic SafetyService.js
 */

export { BlockService } from './BlockService';
export { ReportService } from './ReportService';
export { EmergencyService } from './EmergencyService';
export { DatePlanService } from './DatePlanService';

// Re-export for backward compatibility
import { BlockService } from './BlockService';
import { ReportService } from './ReportService';
import { EmergencyService } from './EmergencyService';
import { DatePlanService } from './DatePlanService';

/**
 * Combined SafetyService for backward compatibility
 * Delegates to modular services
 */
export const SafetyServices = {
  // Block Service
  blockUser: BlockService.blockUser,
  unblockUser: BlockService.unblockUser,
  getBlockedUsers: BlockService.getBlockedUsers,
  isUserBlocked: BlockService.isUserBlocked,
  canInteractWith: BlockService.canInteractWith,

  // Report Service
  reportUser: ReportService.reportUser,
  getReportCategories: ReportService.getReportCategories,
  flagContent: ReportService.flagContent,
  getContentFlags: ReportService.getContentFlags,
  validateReport: ReportService.validateReport,

  // Emergency Service
  sendEmergencySOS: EmergencyService.sendEmergencySOS,
  getActiveSOS: EmergencyService.getActiveSOS,
  respondToSOS: EmergencyService.respondToSOS,
  resolveSOS: EmergencyService.resolveSOS,
  getEmergencyContacts: EmergencyService.getEmergencyContacts,
  addEmergencyContact: EmergencyService.addEmergencyContact,
  deleteEmergencyContact: EmergencyService.deleteEmergencyContact,
  startCheckInTimer: EmergencyService.startCheckInTimer,
  completeCheckIn: EmergencyService.completeCheckIn,
  getActiveCheckIns: EmergencyService.getActiveCheckIns,
  validateEmergencyContact: EmergencyService.validateEmergencyContact,

  // Date Plan Service
  shareDatePlan: DatePlanService.shareDatePlan,
  getActiveDatePlans: DatePlanService.getActiveDatePlans,
  getSharedDatePlans: DatePlanService.getSharedDatePlans,
  updateDatePlanStatus: DatePlanService.updateDatePlanStatus,
  validateDatePlan: DatePlanService.validateDatePlan,
};

export default SafetyServices;

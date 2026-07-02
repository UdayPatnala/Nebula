import type { UserRole, UserPermission } from '../types/auth';

// Define the permissions granted to each role.
// Each role inherits the permissions of the previous role in sequence:
// visitor -> registered_user -> premium_user -> administrator -> super_administrator
export const ROLE_PERMISSIONS: Record<UserRole, Set<UserPermission>> = {
  visitor: new Set<UserPermission>([
    'view_landing_page',
    'view_pricing',
    'view_public_galleries',
    'view_gallery_metadata',
    'share_gallery_links',
  ]),
  
  registered_user: new Set<UserPermission>([
    // Inherited Visitor Permissions
    'view_landing_page',
    'view_pricing',
    'view_public_galleries',
    'view_gallery_metadata',
    'share_gallery_links',
    
    // Own Account & Profile
    'update_profile',
    'change_password',
    'manage_devices',
    'view_active_sessions',
    
    // Projects
    'create_projects',
    'edit_projects',
    'delete_projects',
    'archive_projects',
    'restore_projects',
    
    // Media & AI
    'upload_media',
    'start_ai_analysis',
    'view_ai_progress',
    'edit_media_metadata',
    
    // Gallery Builder
    'choose_gallery_themes',
    'configure_gallery_layouts',
    'publish_galleries',
    'unpublish_galleries',
    
    // Credits
    'view_credit_balance',
    'receive_daily_rewards',
    'purchase_credits',
    
    // Analytics
    'view_project_analytics',
    'view_gallery_analytics',
  ]),

  premium_user: new Set<UserPermission>([
    // Inherited Registered User Permissions
    'view_landing_page',
    'view_pricing',
    'view_public_galleries',
    'view_gallery_metadata',
    'share_gallery_links',
    'update_profile',
    'change_password',
    'manage_devices',
    'view_active_sessions',
    'create_projects',
    'edit_projects',
    'delete_projects',
    'archive_projects',
    'restore_projects',
    'upload_media',
    'start_ai_analysis',
    'view_ai_progress',
    'edit_media_metadata',
    'choose_gallery_themes',
    'configure_gallery_layouts',
    'publish_galleries',
    'unpublish_galleries',
    'view_credit_balance',
    'receive_daily_rewards',
    'purchase_credits',
    'view_project_analytics',
    'view_gallery_analytics',
    
    // Premium Capabilities
    'priority_ai_processing',
    'password_protect_galleries',
    'set_gallery_expiration',
    'watermark_media',
  ]),

  administrator: new Set<UserPermission>([
    // Admins inherit standard permissions for testing/support
    'view_landing_page',
    'view_pricing',
    'view_public_galleries',
    'view_gallery_metadata',
    'share_gallery_links',
    'update_profile',
    'change_password',
    
    // Administrative Capabilities
    'view_all_users',
    'suspend_users',
    'adjust_user_credits',
    'moderate_galleries',
    'monitor_ai_queues',
    'view_system_health',
    'view_audit_logs',
  ]),

  super_administrator: new Set<UserPermission>([
    // Super Admin inherits Administrator Permissions
    'view_landing_page',
    'view_pricing',
    'view_public_galleries',
    'view_gallery_metadata',
    'share_gallery_links',
    'update_profile',
    'change_password',
    'view_all_users',
    'suspend_users',
    'adjust_user_credits',
    'moderate_galleries',
    'monitor_ai_queues',
    'view_system_health',
    'view_audit_logs',
    
    // Super Admin Specific Permissions
    'configure_global_settings',
    'manage_admins',
  ])
};

/**
 * Checks whether a role has permission to execute an action.
 */
export function hasPermission(role: UserRole, permission: UserPermission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.has(permission) : false;
}

/**
 * Returns the storage limit in bytes for a given role.
 */
export function getStorageLimitForRole(role: UserRole): number {
  switch (role) {
    case 'premium_user':
      return 100 * 1024 * 1024 * 1024; // 100 GB
    case 'administrator':
    case 'super_administrator':
      return 500 * 1024 * 1024 * 1024; // 500 GB
    case 'visitor':
      return 0;
    case 'registered_user':
    default:
      return 5 * 1024 * 1024 * 1024; // 5 GB
  }
}

/**
 * Returns the maximum media file upload size in bytes.
 */
export function getMaxUploadSizeForRole(role: UserRole): number {
  switch (role) {
    case 'premium_user':
    case 'administrator':
    case 'super_administrator':
      return 1024 * 1024 * 1024; // 1 GB
    case 'visitor':
      return 0;
    case 'registered_user':
    default:
      return 100 * 1024 * 1024; // 100 MB
  }
}

/**
 * Credit cost constants for every billable platform operation (Section 14).
 */
export const CREDIT_COSTS = {
  AI_ANALYSIS: 10,
  GALLERY_PUBLISH: 5,
  DAILY_CHECKIN_REWARD: 5,
  PREMIUM_THEME: 2,
  EXPORT_ARCHIVE: 3,
} as const;

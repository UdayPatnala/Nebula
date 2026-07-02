export type UserRole = 
  | 'visitor'
  | 'registered_user'
  | 'premium_user'
  | 'administrator'
  | 'super_administrator';

export type UserPermission =
  // Visitor Permissions
  | 'view_landing_page'
  | 'view_pricing'
  | 'view_public_galleries'
  | 'view_gallery_metadata'
  | 'share_gallery_links'
  
  // Registered User Account Permissions
  | 'update_profile'
  | 'change_password'
  | 'manage_devices'
  | 'view_active_sessions'
  
  // Project Management Permissions
  | 'create_projects'
  | 'edit_projects'
  | 'delete_projects'
  | 'archive_projects'
  | 'restore_projects'
  
  // Media & AI Pipeline Permissions
  | 'upload_media'
  | 'start_ai_analysis'
  | 'view_ai_progress'
  | 'edit_media_metadata'
  
  // Gallery Builder Permissions
  | 'choose_gallery_themes'
  | 'configure_gallery_layouts'
  | 'publish_galleries'
  | 'unpublish_galleries'
  
  // Credit & Monetization Permissions
  | 'view_credit_balance'
  | 'receive_daily_rewards'
  | 'purchase_credits'
  
  // Analytics Permissions
  | 'view_project_analytics'
  | 'view_gallery_analytics'
  
  // Premium Permissions
  | 'priority_ai_processing'
  | 'password_protect_galleries'
  | 'set_gallery_expiration'
  | 'watermark_media'
  
  // Administrator Permissions
  | 'view_all_users'
  | 'suspend_users'
  | 'adjust_user_credits'
  | 'moderate_galleries'
  | 'monitor_ai_queues'
  | 'view_system_health'
  | 'view_audit_logs'
  
  // Super Admin Permissions
  | 'configure_global_settings'
  | 'manage_admins';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  credits: number;
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes
  createdAt: string;
}

export interface UserSession {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

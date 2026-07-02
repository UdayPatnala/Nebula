import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  getMaxUploadSizeForRole,
  getStorageLimitForRole,
  CREDIT_COSTS
} from '../config/roles';

// Section 23.3 — Unit Tests: Business logic, RBAC & credit constants

// ---------------------------------------------------------------------------
// RBAC Permissions (Section 3)
// ---------------------------------------------------------------------------
describe('RBAC hasPermission (Section 3)', () => {
  it('registered_user can upload media', () => {
    expect(hasPermission('registered_user', 'upload_media')).toBe(true);
  });

  it('registered_user can publish galleries', () => {
    expect(hasPermission('registered_user', 'publish_galleries')).toBe(true);
  });

  it('registered_user cannot access admin features', () => {
    expect(hasPermission('registered_user', 'view_all_users')).toBe(false);
    expect(hasPermission('registered_user', 'suspend_users')).toBe(false);
    expect(hasPermission('registered_user', 'adjust_user_credits')).toBe(false);
  });

  it('premium_user has priority AI processing', () => {
    expect(hasPermission('premium_user', 'priority_ai_processing')).toBe(true);
  });

  it('premium_user can watermark media', () => {
    expect(hasPermission('premium_user', 'watermark_media')).toBe(true);
  });

  it('administrator can view audit logs', () => {
    expect(hasPermission('administrator', 'view_audit_logs')).toBe(true);
  });

  it('administrator can moderate galleries', () => {
    expect(hasPermission('administrator', 'moderate_galleries')).toBe(true);
  });

  it('super_administrator can manage admins', () => {
    expect(hasPermission('super_administrator', 'manage_admins')).toBe(true);
  });

  it('super_administrator can configure global settings', () => {
    expect(hasPermission('super_administrator', 'configure_global_settings')).toBe(true);
  });

  it('visitor cannot upload media', () => {
    expect(hasPermission('visitor', 'upload_media')).toBe(false);
  });

  it('visitor can view public galleries', () => {
    expect(hasPermission('visitor', 'view_public_galleries')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Upload Size Limits (Section 19)
// ---------------------------------------------------------------------------
describe('Upload Size Limits by Role (Section 19)', () => {
  it('registered_user has 100 MB limit', () => {
    expect(getMaxUploadSizeForRole('registered_user')).toBe(100 * 1024 * 1024);
  });

  it('premium_user has 1 GB limit', () => {
    expect(getMaxUploadSizeForRole('premium_user')).toBe(1024 * 1024 * 1024);
  });

  it('administrator has 1 GB limit', () => {
    expect(getMaxUploadSizeForRole('administrator')).toBe(1024 * 1024 * 1024);
  });

  it('visitor has 0 byte upload limit (cannot upload)', () => {
    expect(getMaxUploadSizeForRole('visitor')).toBe(0);
  });

  it('premium limit is larger than registered limit', () => {
    const free = getMaxUploadSizeForRole('registered_user');
    const premium = getMaxUploadSizeForRole('premium_user');
    expect(premium).toBeGreaterThan(free);
  });
});

// ---------------------------------------------------------------------------
// Storage Limits (Section 18)
// ---------------------------------------------------------------------------
describe('Storage Limits by Role (Section 18)', () => {
  it('registered_user has 5 GB storage', () => {
    expect(getStorageLimitForRole('registered_user')).toBe(5 * 1024 * 1024 * 1024);
  });

  it('premium_user has 100 GB storage', () => {
    expect(getStorageLimitForRole('premium_user')).toBe(100 * 1024 * 1024 * 1024);
  });

  it('administrator has 500 GB storage', () => {
    expect(getStorageLimitForRole('administrator')).toBe(500 * 1024 * 1024 * 1024);
  });

  it('visitor has 0 GB storage', () => {
    expect(getStorageLimitForRole('visitor')).toBe(0);
  });

  it('storage scales: visitor < registered < premium < admin', () => {
    expect(getStorageLimitForRole('visitor'))
      .toBeLessThan(getStorageLimitForRole('registered_user'));
    expect(getStorageLimitForRole('registered_user'))
      .toBeLessThan(getStorageLimitForRole('premium_user'));
    expect(getStorageLimitForRole('premium_user'))
      .toBeLessThan(getStorageLimitForRole('administrator'));
  });
});

// ---------------------------------------------------------------------------
// Credit Cost Constants (Section 14)
// ---------------------------------------------------------------------------
describe('Credit Cost Constants (Section 14)', () => {
  it('AI_ANALYSIS costs 10 credits', () => {
    expect(CREDIT_COSTS.AI_ANALYSIS).toBe(10);
  });

  it('GALLERY_PUBLISH costs 5 credits', () => {
    expect(CREDIT_COSTS.GALLERY_PUBLISH).toBe(5);
  });

  it('DAILY_CHECKIN_REWARD grants 5 credits', () => {
    expect(CREDIT_COSTS.DAILY_CHECKIN_REWARD).toBe(5);
  });

  it('AI analysis is at least as expensive as gallery publish', () => {
    expect(CREDIT_COSTS.AI_ANALYSIS).toBeGreaterThanOrEqual(CREDIT_COSTS.GALLERY_PUBLISH);
  });

  it('all cost values are positive integers', () => {
    Object.values(CREDIT_COSTS).forEach((cost) => {
      expect(cost).toBeGreaterThan(0);
      expect(Number.isInteger(cost)).toBe(true);
    });
  });
});

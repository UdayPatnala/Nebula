/**
 * Nebula Future Roadmap — Feature Flags & Phase Registry
 * Section 27: Future Roadmap, Innovation Framework & Long-Term Evolution
 *
 * Each phase defines a set of features that can be toggled independently.
 * Features behind flags default to false until the phase is activated.
 * Read from import.meta.env.VITE_FF_* for runtime overrides (Section 24.14).
 */

export type RoadmapPhase = 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';

export interface FeatureFlag {
  /** Unique key — matches VITE_FF_* env variable suffix */
  key: string;
  /** Human-readable label for Admin UI */
  label: string;
  /** Section 27 subsection that introduced this feature */
  section: string;
  /** Phase this feature belongs to */
  phase: RoadmapPhase;
  /** Whether this feature is enabled in the current build */
  enabled: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 — Production Platform (Sections 1–26, already live)
// ─────────────────────────────────────────────────────────────────────────────
const PHASE_1_FLAGS: FeatureFlag[] = [
  { key: 'AI_ANALYSIS',         label: 'AI Media Analysis',          section: '15', phase: 'phase1', enabled: true },
  { key: 'GALLERY_GENERATION',  label: 'Gallery Generation Engine',   section: '17', phase: 'phase1', enabled: true },
  { key: 'CREDITS',             label: 'Credit & Usage System',       section: '14', phase: 'phase1', enabled: true },
  { key: 'AUTHENTICATION',      label: 'Authentication & RBAC',       section: '13', phase: 'phase1', enabled: true },
  { key: 'ADMINISTRATION',      label: 'Administration Dashboard',    section: '20', phase: 'phase1', enabled: true },
  { key: 'PERFORMANCE_MONITOR', label: 'Performance Monitor',         section: '22', phase: 'phase1', enabled: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — Creator Platform (Section 27.3)
// ─────────────────────────────────────────────────────────────────────────────
const PHASE_2_FLAGS: FeatureFlag[] = [
  { key: 'PREMIUM_TEMPLATES',   label: 'Premium Gallery Templates',   section: '27.3', phase: 'phase2', enabled: false },
  { key: 'ADVANCED_EDITOR',     label: 'Advanced Gallery Editor',     section: '27.3', phase: 'phase2', enabled: false },
  { key: 'TEAM_COLLABORATION',  label: 'Team Collaboration',          section: '27.7', phase: 'phase2', enabled: false },
  { key: 'COMMENTS',            label: 'Gallery Comments & Reactions',section: '27.3', phase: 'phase2', enabled: false },
  { key: 'COLLECTIONS',         label: 'Media Collections',           section: '27.3', phase: 'phase2', enabled: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — AI Intelligence (Section 27.4)
// ─────────────────────────────────────────────────────────────────────────────
const PHASE_3_FLAGS: FeatureFlag[] = [
  { key: 'AI_STORYTELLING',       label: 'AI Storytelling Engine',      section: '27.4', phase: 'phase3', enabled: false },
  { key: 'NATURAL_LANG_SEARCH',   label: 'Natural Language Search',     section: '27.14', phase: 'phase3', enabled: false },
  { key: 'AI_RECOMMENDATIONS',    label: 'AI Media Recommendations',    section: '27.4', phase: 'phase3', enabled: false },
  { key: 'HIGHLIGHT_REELS',       label: 'Automatic Highlight Reels',   section: '27.4', phase: 'phase3', enabled: false },
  { key: 'AUDIO_TRANSCRIPTION',   label: 'Audio Transcription',         section: '27.4', phase: 'phase3', enabled: false },
  { key: 'SCENE_SUMMARISATION',   label: 'Scene Summarisation',         section: '27.4', phase: 'phase3', enabled: false },
  { key: 'AI_NARRATION',          label: 'AI-Generated Narration',      section: '27.4', phase: 'phase3', enabled: false },
  { key: 'AI_PERSONALISATION',    label: 'AI Personalisation Engine',   section: '27.13', phase: 'phase3', enabled: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — Enterprise (Section 27.8)
// ─────────────────────────────────────────────────────────────────────────────
const PHASE_4_FLAGS: FeatureFlag[] = [
  { key: 'ORGANISATIONS',         label: 'Organisation Management',     section: '27.8', phase: 'phase4', enabled: false },
  { key: 'SSO',                   label: 'Single Sign-On (SSO)',        section: '27.8', phase: 'phase4', enabled: false },
  { key: 'ENTERPRISE_BRANDING',   label: 'Enterprise Branding',         section: '27.8', phase: 'phase4', enabled: false },
  { key: 'COMPLIANCE_REPORTING',  label: 'Compliance Reporting',        section: '27.8', phase: 'phase4', enabled: false },
  { key: 'MULTI_TENANT',          label: 'Multi-Tenant Architecture',   section: '27.15', phase: 'phase4', enabled: false },
  { key: 'ADVANCED_AUDITING',     label: 'Advanced Audit Logging',      section: '27.8', phase: 'phase4', enabled: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5 — Platform Ecosystem (Section 27.12)
// ─────────────────────────────────────────────────────────────────────────────
const PHASE_5_FLAGS: FeatureFlag[] = [
  { key: 'PUBLIC_API',            label: 'Public REST API',             section: '27.12', phase: 'phase5', enabled: false },
  { key: 'PLUGIN_MARKETPLACE',    label: 'Plugin & Theme Marketplace',  section: '27.9',  phase: 'phase5', enabled: false },
  { key: 'DEVELOPER_SDK',         label: 'Developer SDK',               section: '27.12', phase: 'phase5', enabled: false },
  { key: 'WEBHOOKS',              label: 'Webhook Integrations',        section: '27.12', phase: 'phase5', enabled: false },
  { key: 'AUTOMATION_ENGINE',     label: 'Automation Workflow Engine',  section: '27.11', phase: 'phase5', enabled: false },
  { key: 'VR_GALLERIES',          label: 'Virtual Reality Galleries',   section: '27.25', phase: 'phase5', enabled: false },
  { key: 'INTERACTIVE_MAPS',      label: 'Interactive Map Stories',     section: '27.25', phase: 'phase5', enabled: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Master registry — all flags across all phases
// ─────────────────────────────────────────────────────────────────────────────
export const FEATURE_FLAGS: FeatureFlag[] = [
  ...PHASE_1_FLAGS,
  ...PHASE_2_FLAGS,
  ...PHASE_3_FLAGS,
  ...PHASE_4_FLAGS,
  ...PHASE_5_FLAGS,
];

/**
 * Returns the current enabled state for a feature flag.
 * Runtime env variables (VITE_FF_*) take precedence over code defaults.
 */
export function isFeatureEnabled(key: string): boolean {
  const envKey = `VITE_FF_${key}` as keyof ImportMeta['env'];
  const envValue = import.meta.env[envKey];
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === true;
  }
  const flag = FEATURE_FLAGS.find((f) => f.key === key);
  return flag?.enabled ?? false;
}

/**
 * Returns all flags for a given phase.
 */
export function getFlagsForPhase(phase: RoadmapPhase): FeatureFlag[] {
  return FEATURE_FLAGS.filter((f) => f.phase === phase);
}

/**
 * Returns all currently enabled flags.
 */
export function getEnabledFlags(): FeatureFlag[] {
  return FEATURE_FLAGS.filter((f) => isFeatureEnabled(f.key));
}

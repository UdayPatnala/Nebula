import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─────────────────────────────────────────────────────────────────────────────
// Section 25.8 — Autonomous Self-Verification Loop
// This test suite validates the repository's structural health and completeness
// criteria before any production release.
// ─────────────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '../../');

function fileExists(relPath: string) {
  return existsSync(resolve(root, relPath));
}

function readFile(relPath: string) {
  return readFileSync(resolve(root, relPath), 'utf-8');
}

// ── 1. Static Analysis — critical project files exist (Section 25.3) ─────────
describe('Repository Audit — Critical Files Exist (Section 25.3)', () => {
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'vitest.config.ts',
    'Dockerfile',
    'nginx.conf',
    '.env.example',
    '.dockerignore',
    '.github/workflows/ci.yml',
    'src/main.tsx',
    'src/index.css',
    'src/App.tsx',
    'src/routes/index.tsx',
    'src/layouts/AppShell.tsx',
    'src/providers/AuthProvider.tsx',
    'src/providers/ThemeProvider.tsx',
    'src/providers/NotificationProvider.tsx',
    'src/api/client.ts',
    'src/services/mockDb.ts',
    'src/config/roles.ts',
    'src/config/features_manifest.json',
    'src/types/auth.ts',
    'src/types/project.ts',
    'src/hooks/useBreakpoint.ts',
    'src/hooks/useProjectsState.ts',
    'src/hooks/useUploadQueue.ts',
    'src/hooks/useGalleryBuilderState.ts',
  ];

  requiredFiles.forEach((file) => {
    it(`exists: ${file}`, () => {
      expect(fileExists(file), `Missing file: ${file}`).toBe(true);
    });
  });
});

// ── 2. Critical Pages exist (Section 25.7 — UI functions) ────────────────────
describe('Repository Audit — Application Pages Exist (Section 25.7)', () => {
  const pages = [
    'src/pages/LoginPage.tsx',
    'src/pages/SignupPage.tsx',
    'src/pages/DashboardPage.tsx',
    'src/pages/ProjectsPage.tsx',
    'src/pages/UploadPage.tsx',
    'src/pages/AIProcessingPage.tsx',
    'src/pages/AIReviewPage.tsx',
    'src/pages/GalleryBuilderPage.tsx',
    'src/pages/CreditsPage.tsx',
    'src/pages/AdminPage.tsx',
    'src/pages/SettingsPage.tsx',
    'src/pages/PerformancePage.tsx',
  ];

  pages.forEach((page) => {
    it(`exists: ${page}`, () => {
      expect(fileExists(page), `Missing page: ${page}`).toBe(true);
    });
  });
});

// ── 3. No Placeholder Policy (Section 25.6) ──────────────────────────────────
describe('No Placeholder Policy — Forbidden Patterns (Section 25.6)', () => {
  const filesToScan = [
    'src/pages/LoginPage.tsx',
    'src/pages/DashboardPage.tsx',
    'src/pages/CreditsPage.tsx',
    'src/pages/AIProcessingPage.tsx',
    'src/pages/AIReviewPage.tsx',
    'src/pages/GalleryBuilderPage.tsx',
    'src/api/client.ts',
    'src/config/roles.ts',
    'src/services/mockDb.ts',
  ];

  const forbiddenPatterns = [
    { pattern: 'TODO:', label: 'TODO comment' },
    { pattern: 'FIXME:', label: 'FIXME comment' },
    { pattern: 'HACK:', label: 'HACK comment' },
    { pattern: 'throw new Error("Not implemented")', label: 'Not implemented stub' },
    { pattern: 'console.error("TODO")', label: 'TODO error stub' },
  ];

  filesToScan.forEach((file) => {
    if (!fileExists(file)) return;
    const content = readFile(file);
    forbiddenPatterns.forEach(({ pattern, label }) => {
      it(`${file} — no ${label}`, () => {
        expect(content.includes(pattern), `Found "${pattern}" in ${file}`).toBe(false);
      });
    });
  });
});

// ── 4. Secrets Policy (Section 24.12 — no committed secrets) ─────────────────
describe('Secrets Policy — No Hardcoded Credentials (Section 24.12)', () => {
  const filesToScan = [
    'src/api/client.ts',
    'src/services/mockDb.ts',
    'src/config/roles.ts',
    '.env.example',
  ];

  const secretPatterns = [
    'sk-',            // Common hosted-model API key prefix
    'AIzaSy',         // Google AI key prefix
    'AKIA',           // AWS access key prefix
    'password123',    // Obvious hardcoded password
  ];

  filesToScan.forEach((file) => {
    if (!fileExists(file)) return;
    const content = readFile(file);
    secretPatterns.forEach((pattern) => {
      it(`${file} — no hardcoded secret matching "${pattern}"`, () => {
        expect(content.includes(pattern)).toBe(false);
      });
    });
  });
});

// ── 5. CI Pipeline Health (Section 24.6) ─────────────────────────────────────
describe('CI/CD Health Checks (Section 24)', () => {
  it('GitHub Actions workflow file exists', () => {
    expect(fileExists('.github/workflows/ci.yml')).toBe(true);
  });

  it('CI workflow includes test step', () => {
    const ci = readFile('.github/workflows/ci.yml');
    expect(ci).toContain('npm test');
  });

  it('CI workflow includes build step', () => {
    const ci = readFile('.github/workflows/ci.yml');
    expect(ci).toContain('npm run build');
  });

  it('CI workflow includes type-check step', () => {
    const ci = readFile('.github/workflows/ci.yml');
    expect(ci).toContain('tsc');
  });

  it('Dockerfile uses multi-stage build', () => {
    const dockerfile = readFile('Dockerfile');
    expect(dockerfile).toContain('AS builder');
    expect(dockerfile).toContain('AS runtime');
  });

  it('Dockerfile runs as non-root user (Section 24.9)', () => {
    const dockerfile = readFile('Dockerfile');
    expect(dockerfile).toContain('USER nebula');
  });

  it('Dockerfile exposes HEALTHCHECK (Section 24.18)', () => {
    const dockerfile = readFile('Dockerfile');
    expect(dockerfile).toContain('HEALTHCHECK');
  });
});

// ── 6. Design System Integrity (Section 25.10) ───────────────────────────────
describe('Design System Integrity (Section 25.10)', () => {
  it('variables.css design tokens exist', () => {
    expect(fileExists('src/styles/variables.css')).toBe(true);
  });

  it('variables.css defines --color-primary', () => {
    const css = readFile('src/styles/variables.css');
    expect(css).toContain('--color-primary');
  });

  it('variables.css defines dark mode theme', () => {
    const css = readFile('src/styles/variables.css');
    // CSS may use single or double quotes for attribute selectors
    expect(css.includes('[data-theme="dark"]') || css.includes("[data-theme='dark']")).toBe(true);
  });

  it('breakpoints.css responsive tokens exist', () => {
    expect(fileExists('src/styles/breakpoints.css')).toBe(true);
  });
});

// ── 7. Package.json integrity (Section 25.19 — dependency management) ────────
describe('Package.json Integrity (Section 25.19)', () => {
  it('has test script', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.scripts.test).toBeDefined();
  });

  it('has build script', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.scripts.build).toBeDefined();
  });

  it('vitest is in devDependencies', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.devDependencies.vitest).toBeDefined();
  });

  it('react is in dependencies', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.dependencies.react).toBeDefined();
  });

  it('react-router-dom is in dependencies', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.dependencies['react-router-dom']).toBeDefined();
  });
});

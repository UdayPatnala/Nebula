/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ImageItem {
  id: string;
  url: string; // Object URL or static URL
  name: string;
  size: number;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  time12h: string; // e.g., "02:14 PM"
  hour24: number; // For sorting from day start to end
  caption: string;
  category: string;
  location: string;
  peopleCount: number;
  colorPalette: string[];
  isDuplicateOfId?: string | null;
  duplicateIds?: string[];
}

export type PresentationStyle = 'bento' | 'cinematic' | 'museum' | 'grid';

export interface PipelineProgress {
  phase: 'idle' | 'extract' | 'transform' | 'analyze' | 'load' | 'complete';
  total: number;
  current: number;
  currentName: string;
}

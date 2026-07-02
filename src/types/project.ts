export type ProjectStatus = 'draft' | 'analyzing' | 'ready' | 'published';

export interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video';
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  // AI Metadata placeholders
  metadata?: {
    tags?: string[];
    facesCount?: number;
    objects?: string[];
    location?: string;
    caption?: string;
  };
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  media: MediaAsset[];
  mediaCount: number;
  creditsConsumed: number;
  theme?: string;
  layout?: string;
  musicEnabled?: boolean;
  publishedUrl?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

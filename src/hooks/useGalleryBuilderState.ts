import { useState } from 'react';

export interface GalleryConfig {
  theme: string;
  layout: string;
  musicEnabled: boolean;
  musicUrl?: string;
  transitionStyle: 'fade' | 'slide' | 'zoom' | 'none';
  animationIntensity: 'low' | 'medium' | 'high';
  visibility: 'public' | 'unlisted' | 'password' | 'private';
  password?: string;
  allowDownloads: boolean;
  allowComments: boolean;
}

const defaultConfig: GalleryConfig = {
  theme: 'minimalist',
  layout: 'grid',
  musicEnabled: false,
  transitionStyle: 'fade',
  animationIntensity: 'medium',
  visibility: 'public',
  allowDownloads: true,
  allowComments: true
};

export function useGalleryBuilderState(initial?: Partial<GalleryConfig>) {
  const [config, setConfig] = useState<GalleryConfig>({
    ...defaultConfig,
    ...initial
  });

  const updateConfig = (updates: Partial<GalleryConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...updates
    }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  return {
    config,
    updateConfig,
    resetConfig
  };
}

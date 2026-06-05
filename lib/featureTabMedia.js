import { uploadProjectMediaFile } from '@/lib/media/uploadProjectMedia';

/**
 * Upload a feature-tab panel image to project media (avoids base64 in node props).
 * @param {number} projectId
 * @param {File} file
 */
export async function uploadFeatureTabPanelImage(projectId, file) {
  const { publicUrl, altText, title } = await uploadProjectMediaFile(Number(projectId), file, {
    folder: 'feature-tabs',
  });
  const alt = altText || title || String(file.name || '').replace(/\.[^.]+$/, '') || 'Tab image';
  return {
    imageSrc: publicUrl,
    image: publicUrl,
    imageAlt: alt,
  };
}

/** @param {number} projectId @param {File} file @param {{ folder?: string }} [opts] */
export async function uploadCarouselSlideImage(projectId, file, opts = {}) {
  const { publicUrl, altText, title } = await uploadProjectMediaFile(Number(projectId), file, {
    folder: opts.folder || 'carousel',
  });
  const alt = altText || title || String(file.name || '').replace(/\.[^.]+$/, '') || 'Slide image';
  return {
    imageSrc: publicUrl,
    image: publicUrl,
    imageAlt: alt,
  };
}

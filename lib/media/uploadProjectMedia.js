/**
 * Upload a single file to project media storage; returns public URL for builder props.
 * @param {number} projectId
 * @param {File} file
 * @param {{ folder?: string }} [opts]
 * @returns {Promise<{ publicUrl: string, altText?: string, title?: string }>}
 */
export async function uploadProjectMediaFile(projectId, file, opts = {}) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new Error('Media upload requires a valid project');
  }
  if (!file) throw new Error('No file selected');

  const fd = new FormData();
  fd.append('file', file);
  if (opts.folder) fd.append('folder', opts.folder);
  if (file.name) fd.append('title', file.name.replace(/\.[^.]+$/, ''));

  const res = await fetch(`/api/projects/${pid}/media`, { method: 'POST', body: fd });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg = data?.error || data?.message || `Upload failed (${res.status})`;
    throw new Error(msg);
  }
  const item = data?.item || data?.data?.item;
  const publicUrl = item?.publicUrl || item?.public_url;
  if (!publicUrl) throw new Error('Upload succeeded but no public URL returned');
  return {
    publicUrl: String(publicUrl),
    altText: item?.altText || item?.alt_text || '',
    title: item?.title || '',
  };
}

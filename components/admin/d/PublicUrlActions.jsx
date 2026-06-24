'use client';

import { useCallback, useState } from 'react';

/**
 * Open Live + Copy URL actions for project manager rows/cards.
 * @param {{ url: string; btnClassName?: string }} props
 */
export default function PublicUrlActions({ url, btnClassName = 'platform-btn' }) {
  const [copied, setCopied] = useState(false);

  const copyUrl = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert('Could not copy URL');
    }
  }, [url]);

  if (!url) return null;

  return (
    <>
      <a className={btnClassName} href={url} target="_blank" rel="noopener noreferrer">
        Open Live
      </a>
      <button type="button" className={btnClassName} onClick={() => void copyUrl()}>
        {copied ? 'Copied' : 'Copy URL'}
      </button>
    </>
  );
}

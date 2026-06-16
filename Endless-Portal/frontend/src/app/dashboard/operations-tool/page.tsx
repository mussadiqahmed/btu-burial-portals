'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Sheet, Download, ExternalLink, AlertCircle } from 'lucide-react';

const EMBED_URL = (process.env.NEXT_PUBLIC_OPERATIONS_TOOL_EMBED_URL || '').trim();
const SHARE_URL = (process.env.NEXT_PUBLIC_OPERATIONS_TOOL_SHARE_URL || '').trim();
const BASE = process.env.NODE_ENV === 'production' ? '/portal' : '';
const WORKBOOK_PATH = `${BASE}/EEM_Operations_Tool.xlsx`;

/** 1drv.ms inside officeapps embed often shows a blank iframe — need onedrive.live.com/embed URL */
function isLikelyBrokenEmbed(url: string): boolean {
  return (
    url.includes('view.officeapps.live.com') &&
    (url.includes('1drv.ms') || url.includes('1drv.ms.com'))
  );
}

export default function OperationsToolPage() {
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [embedTimedOut, setEmbedTimedOut] = useState(false);

  const brokenEmbed = EMBED_URL ? isLikelyBrokenEmbed(EMBED_URL) : false;
  const showIframe = EMBED_URL && !brokenEmbed;

  useEffect(() => {
    if (!showIframe) return;
    setEmbedLoaded(false);
    setEmbedTimedOut(false);
    const timer = window.setTimeout(() => setEmbedTimedOut(true), 10000);
    return () => window.clearTimeout(timer);
  }, [showIframe, EMBED_URL]);

  const showEmbedHelp = brokenEmbed || (showIframe && embedTimedOut && !embedLoaded);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
            <Sheet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EEM Operations Tool</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Production monitoring spreadsheet (OneDrive)
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SHARE_URL && (
            <a
              href={SHARE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in OneDrive
            </a>
          )}
          <a
            href={WORKBOOK_PATH}
            download
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <Download className="mr-2 h-4 w-4" />
            Download offline copy
          </a>
        </div>
      </div>

      {showEmbedHelp && (
        <div className="mb-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Spreadsheet did not load in the portal</p>
            <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
              Use <strong>Open in OneDrive</strong> to edit the live file. To fix the embed, open the workbook in Excel Online →{' '}
              <strong>File → Share → Embed</strong> → Generate → copy the <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">src=&quot;...&quot;</code> URL
              (must start with <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">https://onedrive.live.com/embed</code>, not <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">1drv.ms</code>).
              Put it in <code className="rounded bg-amber-100 px-1 dark:bg-amber-950">NEXT_PUBLIC_OPERATIONS_TOOL_EMBED_URL</code> and rebuild the frontend.
            </p>
          </div>
        </div>
      )}

      {showIframe ? (
        <Card hoverEffect={false} className="relative flex flex-1 flex-col overflow-hidden p-0">
          {embedTimedOut && !embedLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/95 p-6 text-center dark:bg-gray-900/95">
              <p className="text-sm text-gray-600 dark:text-gray-300">Still loading… or blocked by OneDrive.</p>
              {SHARE_URL && (
                <a
                  href={SHARE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in OneDrive instead
                </a>
              )}
            </div>
          )}
          <iframe
            title="EEM Operations Production Monitoring Tool"
            src={EMBED_URL}
            className="h-full min-h-[650px] w-full flex-1 border-0"
            allowFullScreen
            onLoad={() => setEmbedLoaded(true)}
          />
        </Card>
      ) : (
        <Card hoverEffect={false} className="flex flex-1 flex-col justify-center p-8">
          <div className="mx-auto max-w-xl text-center">
            <Sheet className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              {brokenEmbed ? 'Embed link needs to be updated' : 'Open the live spreadsheet in OneDrive'}
            </h2>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              {brokenEmbed
                ? 'The current embed URL uses a short 1drv.ms link, which usually does not work inside the portal. Use Open in OneDrive below, or ask your admin to add a proper onedrive.live.com/embed URL.'
                : 'The OneDrive embed URL is not set. Staff can use the button below to open and edit the workbook in Excel Online.'}
            </p>
            {SHARE_URL && (
              <a
                href={SHARE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open spreadsheet in OneDrive
              </a>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

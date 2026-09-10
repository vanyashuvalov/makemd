import { downloadBlob } from '@/features/document-actions/model/document-actions'
import { buildDocumentFileName } from '@/shared/lib/document-file-name'
import type { PdfOptions } from '@/widgets/editor-preview/model/pdf-options'
import type { CloudSyncStatus } from '@/features/workspace-cloud-sync/model/use-workspace-cloud-sync'

export function WorkspaceTools({ markdown, title, onImport, pdfOptions, onPdfOptionsChange, localStatus, localReady, isAuthenticated, cloudStatus, onRetry }: {
  markdown: string
  title: string
  onImport: () => void
  pdfOptions: PdfOptions
  onPdfOptionsChange: (options: PdfOptions) => void
  localStatus: 'loading' | 'saving' | 'saved' | 'error'
  localReady: boolean
  isAuthenticated: boolean
  cloudStatus: CloudSyncStatus
  onRetry: () => void
}) {
  return <>
      <div className="fixed left-3 bottom-10 z-20 flex items-center gap-4 bg-card px-3 py-2 text-xs lg:left-[380px]">
        <button type="button" onClick={() => onImport()}>Import</button>
        <button type="button" onClick={() => downloadBlob({ blob: new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), fileName: buildDocumentFileName(title, 'md') })}>Save .md</button>
        <details className="relative">
          <summary className="cursor-pointer">PDF settings</summary>
          <div className="absolute bottom-7 left-0 w-52 space-y-3 rounded-xl border border-border bg-card p-4 shadow-lg">
            <label className="flex justify-between gap-3">Paper<select aria-label="PDF paper size" value={pdfOptions.paper} onChange={(event) => onPdfOptionsChange({ ...pdfOptions, paper: event.target.value as PdfOptions['paper'] })}><option>A4</option><option>Letter</option></select></label>
            <label className="flex justify-between gap-3">Text<select aria-label="PDF text size" value={pdfOptions.textSize} onChange={(event) => onPdfOptionsChange({ ...pdfOptions, textSize: event.target.value as PdfOptions['textSize'] })}><option value="small">Small</option><option value="normal">Normal</option><option value="large">Large</option></select></label>
            <label className="flex justify-between gap-3">Margins<select aria-label="PDF margins" value={pdfOptions.margins} onChange={(event) => onPdfOptionsChange({ ...pdfOptions, margins: event.target.value as PdfOptions['margins'] })}><option value="normal">Normal</option><option value="compact">Compact</option></select></label>
            <p className="text-muted-foreground">Applied to downloaded PDFs.</p>
          </div>
        </details>
      </div>
      <div role="status" aria-live="polite" className="fixed bottom-3 left-3 z-20 max-w-[calc(100vw-24px)] bg-card px-3 py-1 text-xs text-muted-foreground lg:left-[380px] lg:max-w-[calc((100vw-400px)/2)]">
        {localStatus === 'error' ? 'Browser save failed — copy your text before closing' :
          !localReady ? 'Restoring documents…' :
          isAuthenticated ? (cloudStatus === 'error' ? 'Saved locally · Cloud unavailable' : cloudStatus === 'idle' || cloudStatus === 'loading' ? 'Loading cloud…' : cloudStatus === 'saving' ? 'Saving to cloud…' : 'Saved locally and to cloud') :
          localStatus === 'saving' ? 'Saving…' : 'Saved in this browser'}
        {cloudStatus === 'error' && <button type="button" onClick={onRetry} className="ml-2 underline">Retry</button>}
      </div>
  </>
}

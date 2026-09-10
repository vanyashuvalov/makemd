import { DocumentCustomization } from './document-customization'
import { encodeDocumentFile } from '@/entities/document/lib/document-file'
import { downloadBlob } from '@/features/document-actions/model/document-actions'
import { buildDocumentFileName } from '@/shared/lib/document-file-name'
import type { PdfOptions } from '@/widgets/editor-preview/model/pdf-options'
import type { CloudSyncStatus } from '@/features/workspace-cloud-sync/model/use-workspace-cloud-sync'

export function WorkspaceTools({
  markdown,
  title,
  onImport,
  pdfOptions,
  onPdfOptionsChange,
  localStatus,
  localReady,
  isAuthenticated,
  cloudStatus,
  onRetry,
}: {
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
  return (
    <>
      <div className="fixed left-3 bottom-10 z-20 flex items-center gap-1 rounded-full bg-sidebar-surface p-1 text-sm text-sidebar-foreground lg:left-[380px]">
        <button type="button" className="h-10 cursor-pointer rounded-full px-3 hover:bg-sidebar-icon-hover" onClick={() => onImport()}>
          Import
        </button>
        <button
          type="button"
          className="h-10 cursor-pointer rounded-full px-3 hover:bg-sidebar-icon-hover"
          onClick={() =>
            downloadBlob({
              blob: new Blob([encodeDocumentFile(markdown, pdfOptions)], {
                type: 'text/markdown;charset=utf-8',
              }),
              fileName: buildDocumentFileName(title, 'md'),
            })
          }
        >
          Save .md
        </button>
        <DocumentCustomization
          options={pdfOptions}
          onChange={onPdfOptionsChange}
        />
      </div>
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-3 left-3 z-20 max-w-[calc(100vw-24px)] bg-card px-3 py-1 text-xs text-muted-foreground lg:left-[380px] lg:max-w-[calc((100vw-400px)/2)]"
      >
        {localStatus === 'error'
          ? 'Browser save failed — copy your text before closing'
          : !localReady
            ? 'Restoring documents…'
            : isAuthenticated
              ? cloudStatus === 'error'
                ? 'Saved locally · Cloud unavailable'
                : cloudStatus === 'idle' || cloudStatus === 'loading'
                  ? 'Loading cloud…'
                  : cloudStatus === 'saving'
                    ? 'Saving to cloud…'
                    : 'Saved locally and to cloud'
              : localStatus === 'saving'
                ? 'Saving…'
                : 'Saved in this browser'}
        {cloudStatus === 'error' && (
          <button type="button" onClick={onRetry} className="ml-2 underline">
            Retry
          </button>
        )}
      </div>
    </>
  )
}

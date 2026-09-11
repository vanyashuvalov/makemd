import type { CloudSyncStatus } from '@/features/workspace-cloud-sync/model/use-workspace-cloud-sync'

export function WorkspaceTools({
  localStatus,
  localReady,
  isAuthenticated,
  cloudStatus,
  onRetry,
}: {
  localStatus: 'loading' | 'saving' | 'saved' | 'error'
  localReady: boolean
  isAuthenticated: boolean
  cloudStatus: CloudSyncStatus
  onRetry: () => void
}) {
  return (
    <>
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

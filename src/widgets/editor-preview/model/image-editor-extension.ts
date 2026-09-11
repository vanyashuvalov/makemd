import { Decoration, EditorView, MatchDecorator, ViewPlugin, WidgetType, type ViewUpdate } from '@codemirror/view'
import { imageFilesToMarkdown, isImageFile } from '@/features/document-images/model/document-images'

class ImageSourceLabel extends WidgetType {
  eq() { return true }
  toDOM() {
    const span = document.createElement('span')
    span.textContent = 'embedded image'
    span.title = 'Image stored with this document'
    span.style.cssText = 'color:var(--color-muted-foreground);background:var(--color-muted);border-radius:4px;padding:0 4px'
    return span
  }
}

// Keep large embedded payloads out of the visible source while preserving normal
// Markdown on disk. Atomic ranges let selection/delete treat a payload as one unit.
const matcher = new MatchDecorator({
  regexp: /data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+/g,
  maxLength: 1_000_000,
  decoration: Decoration.replace({ widget: new ImageSourceLabel() }),
})
const imageSourceLabels = ViewPlugin.fromClass(class {
  decorations
  constructor(view: EditorView) { this.decorations = matcher.createDeco(view) }
  update(update: ViewUpdate) { this.decorations = matcher.updateDeco(update, this.decorations) }
}, {
  decorations: (value) => value.decorations,
  provide: (plugin) => EditorView.atomicRanges.of((view) => view.plugin(plugin)?.decorations ?? Decoration.none),
})

export function imageEditorExtensions(onError: (message: string) => void) {
  const insert = async (files: File[], view: EditorView) => {
    try {
      onError('')
      const markdown = await imageFilesToMarkdown(files)
      if (!view.dom.isConnected) return
      if (new TextEncoder().encode(view.state.doc.toString() + markdown).length > 2 * 1024 * 1024) {
        throw new Error('The document is full. Use a smaller image or a new document.')
      }
      view.dispatch(view.state.replaceSelection(markdown))
      view.focus()
    } catch (error) {
      if (view.dom.isConnected) onError(error instanceof Error ? error.message : 'Could not add image.')
    }
  }
  return [imageSourceLabels, EditorView.domEventHandlers({
    paste(event, view) {
      const files = Array.from(event.clipboardData?.files ?? []).filter(isImageFile)
      if (!files.length) return false
      event.preventDefault()
      void insert(files, view)
      return true
    },
    drop(event, view) {
      const files = Array.from(event.dataTransfer?.files ?? []).filter(isImageFile)
      if (!files.length) return false
      event.preventDefault()
      const position = view.posAtCoords({ x: event.clientX, y: event.clientY })
      if (position !== null) view.dispatch({ selection: { anchor: position } })
      void insert(files, view)
      return true
    },
  })]
}

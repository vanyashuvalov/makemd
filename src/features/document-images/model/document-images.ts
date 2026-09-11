// Raster images are embedded in Markdown, so guest drafts, cloud sync and PDFs
// retain them without temporary blob URLs or a separate asset account.
export function isImageFile(file: File) {
  return /^image\/(png|jpeg|webp|gif|avif)$/i.test(file.type) || /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name)
}

export async function imageFilesToMarkdown(files: File[]) {
  const images: string[] = []
  for (const file of files) {
    if (!isImageFile(file)) throw new Error('Use a PNG, JPEG, WebP, GIF or AVIF image.')
    if (file.size > 20 * 1024 * 1024) throw new Error('Choose an image smaller than 20 MB.')
    const bitmap = await createImageBitmap(file)
    try {
      const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Could not read this image.')
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      let data = canvas.toDataURL('image/webp', 0.9)
      if (data.length > 600_000) data = canvas.toDataURL('image/webp', 0.65)
      if (data.length > 1_000_000) throw new Error('This image is too large. Try a smaller version.')
      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[\[\]\\\r\n]/g, ' ').trim() || 'Image'
      images.push(`![${alt}](${data})`)
    } finally {
      bitmap.close()
    }
  }
  return '\n\n' + images.join('\n\n') + '\n\n'
}

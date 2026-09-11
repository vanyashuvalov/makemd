# Style controls and images — 2026-09-11

The preview toolbar now contains the title, a style icon and PDF download. The style icon replaces the Markdown copy action. The separate Import / Save .md toolbar is removed; dropping Markdown files remains supported.

The small style menu has a font selector, independent text/background colors and continuous horizontal/vertical margin sliders. It uses the workspace's dark surface and opens beside the toolbar. Settings persist per document and apply to preview and PDF, including the full printed page background. Legacy styles keep their serialized shape until edited.

Images can be pasted or dropped into the editor; dropping on the preview appends them to the current document. Raster files are resized to at most 2000 pixels on the longer side and embedded as WebP in Markdown, so they survive local reload, favorites and existing cloud serialization. The source editor displays a compact placeholder for each embedded payload. Existing remote Markdown image URLs no longer require the image host to send CORS headers. PDF export waits for image decoding.

Verification: lint, TypeScript and build passed; 18 regression tests cover styles, safe embedded URLs, file recognition and persistence/sync behavior. Browser checks cover independent colors, font and sliders, refresh, paste and drop, compact source display and PDF download with an embedded image. The generated PDF was rendered and inspected. Desktop and mobile layout checked. Physical iPhone clipboard behavior and authenticated multi-device sync remain untested.

Limits: raster images up to 20 MB are accepted and optimized; the existing 2 MB total document limit still applies. Animated images are embedded as a still frame. External image availability depends on its host.

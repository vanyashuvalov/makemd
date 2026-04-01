# Markdown syntax test

**Purpose:** a compact sample to verify editor highlighting, line wrapping, and preview rendering.

## Headings

# H1 heading
## H2 heading
### H3 heading
#### H4 heading
##### H5 heading
###### H6 heading

## Inline syntax

This line has **bold text**, *italic text*, ~~strikethrough~~, and `inline code`.

This line has a [link to Portfolio](https://ivanshuvalov.vercel.app/) and an autolink https://example.com.

## Lists

- Bullet item one
- Bullet item two with **bold** and `code`
  - Nested bullet item
  - Another nested item

1. Ordered item one
2. Ordered item two
   1. Nested ordered item
   2. Another nested ordered item

- [ ] Task item unchecked
- [x] Task item checked

## Blockquote

> Blockquote line one
> Blockquote line two with a [link](https://example.com)

## Divider

---

## Code

```ts
type User = {
  id: string
  name: string
}

const user: User = {
  id: '42',
  name: 'Ivan',
}
```

## Table

| Feature | Status | Notes |
| --- | --- | --- |
| Headings | Done | H1-H6 |
| Lists | Done | Bullet and ordered |
| Links | Done | Inline and autolink |
| Code | Done | Inline and fenced |

## Image

![Test image](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200)

## Mixed paragraph

Markdown is useful when you need **structure**, *speed*, and `clarity`.
It also works well with [documentation](https://example.com/docs) and
long wrapped lines that should stay aligned with the gutter.

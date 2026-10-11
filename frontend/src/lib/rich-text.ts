// Same rule as the backend's schemas/rich-text.ts: resume text supports **bold** and [the words](https://address).
export const inlineLink = /\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g

// The words a reader sees, with each link's address left out.
export const withoutLinks = (text: string) => text.replace(inlineLink, '$1')

export function linkParts(text: string) {
  const parts: { text: string; url?: string }[] = []
  let last = 0
  for (const match of text.matchAll(inlineLink)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) })
    parts.push({ text: match[1], url: match[2] })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}

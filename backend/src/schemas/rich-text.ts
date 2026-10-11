// Resume text supports **bold** and inline links written [the words](https://address), the way Markdown does.
// Only web and mailto addresses become links; anything else stays as typed.
export const inlineLink = /\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g;

// The words a reader sees: link text without its address, bold without its markers.
export const plainText = (text: string) => text.replace(inlineLink, "$1").replace(/\*\*/g, "");

// Splits text into plain runs and links, in order.
export function linkParts(text: string): ({ text: string } | { text: string; url: string })[] {
  const parts: ({ text: string } | { text: string; url: string })[] = [];
  let last = 0;
  for (const match of text.matchAll(inlineLink)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ text: match[1]!, url: match[2]! });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

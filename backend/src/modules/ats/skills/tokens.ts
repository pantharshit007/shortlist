// A token keeps the punctuation that belongs to a skill name (C++, C#, .NET, Node.js, ASP.NET); "/", "-",
// "," and spaces split, so "CI/CD" and "CI CD" both read as "ci cd".
const TOKEN = /(?<![\p{L}\p{N}])\.?[\p{L}\p{N}]+(?:\.[\p{L}\p{N}]+)*[+#]*/gu;

export type Token = { raw: string; key: string; start: number; end: number };

export const tokenize = (text: string): Token[] =>
  [...text.matchAll(TOKEN)].map((m) => ({
    raw: m[0],
    key: m[0].toLowerCase(),
    start: m.index,
    end: m.index + m[0].length,
  }));

export const nameKey = (name: string) =>
  tokenize(name)
    .map((t) => t.key)
    .join(" ");

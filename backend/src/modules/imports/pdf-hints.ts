import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

type Run = { str: string; x: number; y: number };

// PDF links usually sit behind words like "GitHub" or an icon, so the URL never shows in the text the model reads.
// Returns each web link with the words under it, or the whole line for an icon with no words.
export async function pdfLinks(pdf: Uint8Array, maxPages = 4) {
  const task = getDocument({ data: pdf.slice(), useSystemFonts: false, verbosity: 0 });
  try {
    const doc = await task.promise;
    const links: { text: string; url: string }[] = [];
    for (let number = 1; number <= Math.min(doc.numPages, maxPages); number++) {
      const page = await doc.getPage(number);
      const runs: Run[] = (await page.getTextContent()).items.flatMap((item) =>
        "str" in item && item.str.trim() ? [{ str: item.str, x: item.transform[4], y: item.transform[5] }] : [],
      );
      for (const annotation of await page.getAnnotations()) {
        const url = annotation.subtype === "Link" ? (annotation.url as string | undefined) : undefined;
        if (!url || !/^https?:\/\//i.test(url)) continue;
        const [x1, y1, x2, y2] = annotation.rect as [number, number, number, number];
        const onLine = runs.filter((run) => run.y >= y1 - 2 && run.y <= y2).sort((a, b) => a.x - b.x);
        const under = onLine.filter((run) => run.x >= x1 - 1 && run.x <= x2);
        const text = (under.length ? under : onLine).map((run) => run.str.trim()).join(" ");
        links.push({ text: text.slice(0, 80), url });
      }
      page.cleanup();
    }
    return links;
  } catch {
    // Links are a bonus; a PDF pdf.js can't read still imports from its text.
    return [];
  } finally {
    await task.destroy();
  }
}

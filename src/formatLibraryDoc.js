import React from 'react';

/**
 * Plain-text convention:
 * - Lines starting with "## " → <h2>
 * - Lines starting with "- " → grouped into one <ul>
 * - Blank lines flush paragraph buffer
 * - Other lines → merged into <p> (space-joined)
 */
export function formatLibraryDoc(text) {
  if (!text || !String(text).trim()) {
    return [<p key="empty">No content available.</p>];
  }
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  let para = [];

  const flushPara = () => {
    if (para.length) {
      const body = para.join(' ');
      blocks.push(<p key={`p-${blocks.length}`}>{body}</p>);
      para = [];
    }
  };

  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trim();
    if (!t) {
      flushPara();
      i += 1;
      continue;
    }
    if (t.startsWith('## ')) {
      flushPara();
      blocks.push(
        <h2 key={`h-${blocks.length}`} className="library-section-title">
          {t.slice(3).trim()}
        </h2>
      );
      i += 1;
      continue;
    }
    if (t.startsWith('- ')) {
      flushPara();
      const items = [];
      while (i < lines.length) {
        const lt = lines[i].trim();
        if (!lt.startsWith('- ')) break;
        items.push(lt.slice(2).trim());
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${blocks.length}`}>
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
      continue;
    }
    para.push(t);
    i += 1;
  }
  flushPara();
  return blocks;
}

/** Split markdown-style docs on lines starting with "## " into { title, body } chunks (body excludes ## lines). */
export function splitMarkdownSections(text) {
  if (!text || !String(text).trim()) return [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const sections = [];
  let current = null;
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (current) sections.push(current);
      current = { title: line.replace(/^##\s+/, '').trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections.map((s) => ({
    title: s.title,
    body: s.lines.join('\n').trim()
  }));
}

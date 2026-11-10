import React from 'react';

/**
 * Lightweight markdown renderer for the AI Copilot answers (no dependencies, no raw HTML).
 * Supports: # headings, **bold**, *italic*, `code`, > quotes, --- rules,
 * bullet lists (-, *, •), numbered lists with nested bullets and indented continuations.
 */

const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|(?<![*\w])\*[^*\s][^*]*\*(?![*\w]))/g;

function renderInline(text, keyPrefix = 'i') {
  return text.split(INLINE_RE).map((part, i) => {
    if (!part) return null;
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-white">
          {renderInline(part.slice(2, -2), key)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={key} className="px-1.5 py-0.5 rounded-md bg-white/[0.08] border border-white/10 text-[0.92em] font-mono text-emerald-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={key} className="italic text-zinc-100">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

/** Lines of one paragraph keep their manual line breaks. */
function renderLines(lines, keyPrefix) {
  return lines.map((line, i) => (
    <React.Fragment key={`${keyPrefix}-${i}`}>
      {i > 0 && <br />}
      {renderInline(line, `${keyPrefix}-${i}`)}
    </React.Fragment>
  ));
}

const ORDERED_RE = /^(\s*)(\d+)[.)]\s+(.*)$/;
const BULLET_RE = /^(\s*)[-*•]\s+(.*)$/;
const HEADING_RE = /^(#{1,4})\s+(.*)$/;
const indentOf = (line) => line.match(/^\s*/)[0].length;
const isListLine = (line) => ORDERED_RE.test(line) || BULLET_RE.test(line);

function parse(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  const nextNonBlank = (from) => {
    for (let j = from; j < lines.length; j += 1) if (lines[j].trim()) return lines[j];
    return null;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^\s*(-{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      i += 1;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'quote', lines: quote });
      continue;
    }

    if (isListLine(line)) {
      const ordered = ORDERED_RE.test(line);
      const baseIndent = indentOf(line);
      const items = [];
      while (i < lines.length) {
        const cur = lines[i];
        if (!cur.trim()) {
          // A blank line keeps the list open only if the list goes on afterwards.
          const peek = nextNonBlank(i);
          if (peek && (isListLine(peek) || indentOf(peek) > baseIndent) && !HEADING_RE.test(peek.trim())) {
            i += 1;
            continue;
          }
          break;
        }
        const om = cur.match(ORDERED_RE);
        const bm = cur.match(BULLET_RE);
        const ind = indentOf(cur);
        if (ind <= baseIndent + 1 && ((ordered && om) || (!ordered && bm))) {
          items.push({
            number: om ? Number(om[2]) : null,
            text: om ? om[3] : bm[2],
            lines: [],
            children: [],
          });
        } else if (items.length && (bm || om) && ind > baseIndent) {
          items[items.length - 1].children.push((bm ? bm[2] : om[3]).trim());
        } else if (items.length && ind > baseIndent) {
          items[items.length - 1].lines.push(cur.trim());
        } else {
          break;
        }
        i += 1;
      }
      blocks.push({ type: ordered ? 'ol' : 'ul', items });
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !HEADING_RE.test(lines[i]) &&
      !/^\s*>/.test(lines[i]) &&
      !isListLine(lines[i]) &&
      !/^\s*(-{3,}|_{3,})\s*$/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'p', lines: para });
  }

  return blocks;
}

const HEADING_CLASSES = {
  1: 'text-base font-bold text-white mt-1',
  2: 'text-[15px] font-bold text-white mt-1',
  3: 'text-sm font-semibold text-white',
  4: 'text-xs font-semibold uppercase tracking-wide text-zinc-300',
};

export default function Markdown({ text, className = '' }) {
  const blocks = React.useMemo(() => parse(String(text ?? '')), [text]);

  return (
    <div className={`space-y-3 font-sans break-words ${className}`}>
      {blocks.map((b, idx) => {
        const key = `b-${idx}`;
        switch (b.type) {
          case 'hr':
            return <hr key={key} className="border-white/10" />;
          case 'heading':
            return (
              <div key={key} role="heading" aria-level={b.level + 1} className={HEADING_CLASSES[b.level]}>
                {renderInline(b.text, key)}
              </div>
            );
          case 'quote':
            return (
              <blockquote
                key={key}
                className="border-l-2 border-amber-400/60 bg-amber-400/[0.06] rounded-r-xl text-zinc-200"
                style={{ padding: '10px 14px' }}
              >
                {renderLines(b.lines, key)}
              </blockquote>
            );
          case 'ul':
          case 'ol':
            return (
              <ul key={key} className="space-y-2.5 list-none">
                {b.items.map((item, n) => (
                  <li key={`${key}-${n}`} className="flex gap-2.5 min-w-0">
                    <span
                      className={`shrink-0 text-zinc-500 select-none ${
                        b.type === 'ol' ? 'font-mono text-[12px] w-5 text-right pt-px' : 'w-3 text-center'
                      }`}
                      aria-hidden="true"
                    >
                      {b.type === 'ol' ? `${item.number}.` : '•'}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div>{renderInline(item.text, `${key}-${n}`)}</div>
                      {item.lines.length > 0 && (
                        <div className="text-zinc-300">{renderLines(item.lines, `${key}-${n}-l`)}</div>
                      )}
                      {item.children.length > 0 && (
                        <ul className="space-y-1.5 list-none text-zinc-300">
                          {item.children.map((child, c) => (
                            <li key={`${key}-${n}-c-${c}`} className="flex gap-2.5 min-w-0">
                              <span className="shrink-0 w-3 text-center text-zinc-600 select-none" aria-hidden="true">
                                –
                              </span>
                              <span className="min-w-0 flex-1">{renderInline(child, `${key}-${n}-c-${c}`)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            );
          default:
            return <p key={key}>{renderLines(b.lines, key)}</p>;
        }
      })}
    </div>
  );
}

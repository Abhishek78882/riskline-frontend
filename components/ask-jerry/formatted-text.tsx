import { Fragment } from "react";

// The Q&A endpoint (unlike Diagnosis) has no structured-output schema, so
// Gemini is free to write markdown-style emphasis in its prose. This is a
// deliberately tiny parser for exactly that — bold segments and paragraph
// breaks — not a general markdown renderer.
function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>
    ),
  );
}

export function FormattedText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n+/).filter(Boolean);
  if (paragraphs.length <= 1) {
    return <p className={className}>{parseInline(text, "p")}</p>;
  }
  return (
    <div className={className}>
      {paragraphs.map((line, i) => (
        <p key={i} className={i > 0 ? "mt-2" : undefined}>
          {parseInline(line, String(i))}
        </p>
      ))}
    </div>
  );
}

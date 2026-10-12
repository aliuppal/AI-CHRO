import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Model output as Markdown. Raw HTML is not rendered (react-markdown escapes it). */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-neutral max-w-none text-[15px] leading-relaxed prose-headings:font-medium prose-headings:tracking-tight prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-a:text-foreground prose-strong:font-medium prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-md prose-pre:bg-night prose-table:text-sm prose-th:font-medium">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

export const Markdown = ({ content }: { content: string }) => (
  <div className="rich-markdown text-[0.9375rem] leading-relaxed text-[color:var(--foreground)] w-full break-words">
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
      {content}
    </ReactMarkdown>
  </div>
);

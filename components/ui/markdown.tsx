import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

export const Markdown = ({ content }: { content: string }) => (
  <div className="rich-markdown text-sm leading-7 text-[color:var(--foreground)]">
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
      {content}
    </ReactMarkdown>
  </div>
);

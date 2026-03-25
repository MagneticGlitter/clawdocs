"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseClawChart, parseClawTable } from "@/lib/parseClawBlocks";
import ClawChart from "@/components/charts/ClawChart";
import ClawTable from "@/components/charts/ClawTable";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const rendered = useMemo(() => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const lang = match?.[1];
            const codeString = String(children).replace(/\n$/, "");

            if (lang === "clawchart") {
              const config = parseClawChart(codeString);
              if (config) return <ClawChart config={config} />;
            }

            if (lang === "clawtable") {
              const config = parseClawTable(codeString);
              if (config) return <ClawTable config={config} />;
            }

            if (lang) {
              return (
                <div className="my-3 rounded-lg overflow-hidden border border-slate-700/50">
                  <div className="flex items-center px-4 py-1.5 bg-slate-800/80 border-b border-slate-700/50">
                    <span className="text-xs text-slate-400 font-medium">{lang}</span>
                  </div>
                  <pre className="p-4 overflow-x-auto bg-slate-900/50">
                    <code className="text-sm text-slate-300">{codeString}</code>
                  </pre>
                </div>
              );
            }

            return (
              <code className="px-1.5 py-0.5 rounded bg-slate-700/50 text-indigo-300 text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          h1: ({ children }) => <h1 className="text-3xl font-bold text-white mt-8 mb-4 pb-2 border-b border-slate-700/50">{children}</h1>,
          h2: ({ children }) => <h2 className="text-2xl font-semibold text-white mt-6 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-200 mt-5 mb-2">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-semibold text-slate-300 mt-4 mb-2">{children}</h4>,
          p: ({ children }) => <p className="text-slate-300 leading-relaxed mb-4">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside text-slate-300 mb-4 space-y-1 ml-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-slate-300 mb-4 space-y-1 ml-2">{children}</ol>,
          li: ({ children }) => <li className="text-slate-300">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-500/50 pl-4 my-4 text-slate-400 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-hidden rounded-xl border border-slate-700/50">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-800/80">{children}</thead>,
          th: ({ children }) => <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">{children}</th>,
          tbody: ({ children }) => <tbody className="divide-y divide-slate-700/50">{children}</tbody>,
          tr: ({ children }) => <tr className="bg-slate-800/20 hover:bg-slate-800/40 transition-colors">{children}</tr>,
          td: ({ children }) => <td className="px-4 py-2.5 text-slate-300">{children}</td>,
          a: ({ children, href }) => (
            <a href={href} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          hr: () => <hr className="my-6 border-slate-700/50" />,
          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-slate-200">{children}</em>,
          img: ({ src, alt }) => (
            <img src={src} alt={alt || ""} className="rounded-lg my-4 max-w-full border border-slate-700/50" />
          ),
          input: ({ checked, ...props }) => (
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mr-2 accent-indigo-500"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }, [content]);

  return (
    <div className={`prose-invert max-w-none p-6 overflow-y-auto h-full bg-[#0f1419] ${className ?? ""}`}>
      {rendered}
    </div>
  );
}

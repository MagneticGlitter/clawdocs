"use client";

import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands";
import { languages } from "@codemirror/language-data";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
  },
  ".cm-scroller": {
    fontFamily: "var(--font-geist-mono), 'Fira Code', 'Cascadia Code', monospace",
    lineHeight: "1.7",
    padding: "16px 0",
  },
  ".cm-content": {
    padding: "0 16px",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "1px solid #1e293b",
    color: "#475569",
    minWidth: "48px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "#94a3b8",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(99, 102, 241, 0.06)",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(99, 102, 241, 0.2) !important",
  },
  ".cm-cursor": {
    borderLeftColor: "#818cf8",
    borderLeftWidth: "2px",
  },
});

export default function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const isExternalUpdate = useRef(false);

  const createState = useCallback(
    (doc: string) =>
      EditorState.create({
        doc,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          drawSelection(),
          rectangularSelection(),
          indentOnInput(),
          bracketMatching(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          editorTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !isExternalUpdate.current) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
          EditorView.lineWrapping,
        ],
      }),
    []
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: createState(value),
      parent: containerRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createState]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      isExternalUpdate.current = true;
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
      isExternalUpdate.current = false;
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`h-full overflow-hidden bg-[#0d1117] ${className ?? ""}`}
    />
  );
}

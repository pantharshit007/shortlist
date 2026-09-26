import {
  HighlightStyle,
  StreamLanguage,
  syntaxHighlighting,
} from '@codemirror/language'
import { stex } from '@codemirror/legacy-modes/mode/stex'
import { linter, lintGutter } from '@codemirror/lint'
import type { Diagnostic } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import CodeMirror from '@uiw/react-codemirror'
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import type { CompileError } from '@/hooks/use-pdf-preview'

// Colors come from the app's CSS variables, so the editor follows light and dark mode.
const theme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13.5px',
    backgroundColor: 'var(--card)',
    color: 'var(--foreground)',
  },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.65' },
  '.cm-content': { padding: '12px 0', caretColor: 'var(--primary)' },
  '.cm-gutters': {
    backgroundColor: 'var(--muted)',
    color: 'var(--muted-foreground)',
    borderRight: '1px solid var(--border)',
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in oklab, var(--primary) 7%, transparent)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
  },
  '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--primary)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor:
      'color-mix(in oklab, var(--highlight) 45%, transparent) !important',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--popover)',
    color: 'var(--popover-foreground)',
    border: '1px solid var(--border)',
  },
})

const highlight = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--primary)' },
  { tag: tags.tagName, color: 'var(--primary)' },
  { tag: [tags.bracket, tags.brace], color: 'var(--muted-foreground)' },
  { tag: tags.comment, color: 'var(--muted-foreground)', fontStyle: 'italic' },
  { tag: [tags.atom, tags.number], color: 'var(--chart-3)' },
  { tag: tags.string, color: 'var(--chart-4)' },
])

export type LatexEditorHandle = { goToLine: (line: number) => void }

export const LatexEditor = forwardRef<
  LatexEditorHandle,
  {
    value: string
    onChange: (value: string) => void
    errors: CompileError[] | null
  }
>(function LatexEditor({ value, onChange, errors }, ref) {
  const editor = useRef<ReactCodeMirrorRef>(null)

  useImperativeHandle(ref, () => ({
    goToLine(line) {
      const view = editor.current?.view
      if (!view) return
      const target = view.state.doc.line(
        Math.min(Math.max(line, 1), view.state.doc.lines),
      )
      view.dispatch({
        selection: { anchor: target.from, head: target.to },
        scrollIntoView: true,
      })
      view.focus()
    },
  }))

  const extensions = useMemo(
    () => [
      StreamLanguage.define(stex),
      syntaxHighlighting(highlight),
      theme,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': 'LaTeX source' }),
      lintGutter(),
      linter(
        (view): Diagnostic[] =>
          (errors ?? [])
            .filter(
              (error) =>
                error.line !== null && error.line <= view.state.doc.lines,
            )
            .map((error) => {
              const line = view.state.doc.line(error.line!)
              return {
                from: line.from,
                to: line.to,
                severity: 'error',
                message: error.hint
                  ? `${error.message}\n${error.hint}`
                  : error.message,
              }
            }),
        { delay: 0 },
      ),
    ],
    [errors],
  )

  return (
    <CodeMirror
      ref={editor}
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme="none"
      height="100%"
      className="h-full"
      basicSetup={{
        foldGutter: false,
        highlightActiveLine: true,
        autocompletion: true,
      }}
    />
  )
})

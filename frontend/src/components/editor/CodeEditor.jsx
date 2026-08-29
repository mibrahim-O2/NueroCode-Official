import Editor from '@monaco-editor/react';

export const DEFAULT_SNIPPETS = {
  python: 'def solve(*args):\n    # Write your solution here\n    pass\n',
  javascript: 'function solve(...args) {\n  // Write your solution here\n}\n',
  cpp: '// Write a function named solve(...) returning a number, string, or bool\n\n',
};

function defineNeuroCodeTheme(monaco) {
  monaco.editor.defineTheme('neurocode-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'D4AF37' },
      { token: 'string', foreground: 'F3DE8A' },
      { token: 'comment', foreground: '6B7280' },
      { token: 'number', foreground: '2DD4A0' },
    ],
    colors: {
      'editor.background': '#17120D',
      'editor.foreground': '#F7F4F0',
      'editorCursor.foreground': '#FF6E1A',
      'editor.selectionBackground': '#FF6E1A40',
      'editorLineNumber.foreground': '#5C4F42',
      'editorLineNumber.activeForeground': '#A99B8C',
    },
  });
}

export default function CodeEditor({ language, value, onChange, onPasteDetected }) {
  const handleMount = (editor) => {
    if (!onPasteDetected) return;
    // Monaco's own paste event — fires reliably regardless of whether the
    // browser's native ClipboardEvent bubbles to document, unlike a raw
    // document-level 'paste' listener which Monaco can bypass internally.
    editor.onDidPaste((e) => {
      const pastedText = editor.getModel()?.getValueInRange(e.range) ?? '';
      onPasteDetected(pastedText.length);
    });
  };

  return (
    <div className="overflow-hidden rounded-card border border-border shadow-card">
      <Editor
        height="420px"
        language={language}
        theme="neurocode-dark"
        value={value}
        onChange={(v) => onChange(v ?? '')}
        beforeMount={defineNeuroCodeTheme}
        onMount={handleMount}
        options={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16 },
          automaticLayout: true,
        }}
      />
    </div>
  );
}
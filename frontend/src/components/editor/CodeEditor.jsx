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
      { token: 'number', foreground: '00C48C' },
    ],
    colors: {
      'editor.background': '#111315',
      'editor.foreground': '#F8FAFC',
      'editorCursor.foreground': '#00A676',
      'editor.selectionBackground': '#00A67655',
      'editorLineNumber.foreground': '#4B5563',
      'editorLineNumber.activeForeground': '#94A3B8',
    },
  });
}

export default function CodeEditor({ language, value, onChange }) {
  return (
    <div className="overflow-hidden rounded-card border border-border shadow-card">
      <Editor
        height="420px"
        language={language}
        theme="neurocode-dark"
        value={value}
        onChange={(v) => onChange(v ?? '')}
        beforeMount={defineNeuroCodeTheme}
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
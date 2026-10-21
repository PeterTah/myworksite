import { common, createLowlight } from 'lowlight';
import powershell from 'highlight.js/lib/languages/powershell';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import nginx from 'highlight.js/lib/languages/nginx';

// Shared between the editor (lowlight) and the article renderer (highlight.js)
export const extraLanguages = { powershell, dockerfile, nginx };

export const lowlight = createLowlight({ ...common, ...extraLanguages });

// Languages offered in the editor's code block picker
export const CODE_LANGUAGES: { value: string; label: string }[] = [
  { value: '', label: 'Auto' },
  { value: 'plaintext', label: 'Plain text' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell session' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML / HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'ini', label: 'INI / TOML' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'diff', label: 'Diff' },
  { value: 'markdown', label: 'Markdown' },
];

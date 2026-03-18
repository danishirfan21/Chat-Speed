import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { crx, defineManifest } from '@crxjs/vite-plugin'

const manifest = defineManifest({
  manifest_version: 3,
  name: 'ChatSpeed',
  version: '1.0.0',
  action: { default_popup: 'index.html' },
  content_scripts: [
    {
      js: ['src/content.tsx'],
      matches: [
        'https://*.chatgpt.com/*',
        'https://*.openai.com/*',
        'https://chat.jules.ai/*'
      ],
      run_at: 'document_start',
    },
  ],
})

export default defineConfig({
  plugins: [react(), crx({ manifest })],
})

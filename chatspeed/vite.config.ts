import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { crx, defineManifest } from '@crxjs/vite-plugin'

const manifest = defineManifest({
  manifest_version: 3,
  name: 'ChatSpeed',
  version: '1.0.0',
  icons: {
    "16": "icon16.png",
    "32": "icon32.png",
    "48": "icon48.png",
    "128": "icon128.png",
  },
  action: { 
    default_popup: 'index.html',
    default_icon: {
      "16": "icon16.png",
      "32": "icon32.png",
      "48": "icon48.png",
      "128": "icon128.png",
    }
  },
  permissions: ['activeTab'],
  background: {
    service_worker: 'src/background.ts',
    type: 'module' as const,
  },
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
  web_accessible_resources: [
    {
      resources: ['injected.js'],
      matches: [
        'https://*.chatgpt.com/*',
        'https://*.openai.com/*',
        'https://chat.jules.ai/*'
      ],
    },
  ],
})

export default defineConfig({
  plugins: [react(), crx({ manifest })],
})

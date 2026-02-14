import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  "name": "Word in Sentence",
  "description": "웹 페이지에서 선택된 문장을 번역하고, 주요 단어에 대해 설명합니다.",
  "version": "1.0",
  "manifest_version": 3,
  "permissions": ["storage"],
  "options_page": "src/options/index.html",
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/index.ts"],
      "run_at": "document_idle",
      "all_frames": true,  // 이거 없으면 iframe 내 이벤트를 감지 못함.
    }
  ],
});
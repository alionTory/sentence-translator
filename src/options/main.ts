import "./style.css";
import { loadSettings, saveSettings, type LlmProvider, type Settings } from "../shared/settings";

function byId<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: ${id}`);
    return el as T;
}

const providerEl = byId<HTMLSelectElement>("provider");
const modelEl = byId<HTMLInputElement>("model");
const apiKeyEl = byId<HTMLInputElement>("apiKey");
const targetLanguageEl = byId<HTMLInputElement>("targetLanguage");
const contentFontSizeEl = byId<HTMLInputElement>("contentFontSize");
const saveBtn = byId<HTMLButtonElement>("save");
const statusEl = byId<HTMLSpanElement>("status");

async function init() {
    const loadedSettings = await loadSettings();

    providerEl.value = loadedSettings.provider;
    modelEl.value = loadedSettings.model;
    apiKeyEl.value = loadedSettings.apiKey;
    targetLanguageEl.value = loadedSettings.targetLanguage;
    contentFontSizeEl.value = loadedSettings.contentFontSize.toString();

    saveBtn.addEventListener("click", async () => {
        const next: Settings = {
            provider: providerEl.value as LlmProvider,
            model: modelEl.value.trim(),
            apiKey: apiKeyEl.value.trim(),
            targetLanguage: targetLanguageEl.value.trim(),
            contentFontSize: parseInt(contentFontSizeEl.value) || 16,
        };

        if (!next.model) {
            statusEl.textContent = "Model을 입력하세요.";
        } else if (!next.apiKey) {
            statusEl.textContent = "API Key를 입력하세요.";
        } else {
            await saveSettings(next);
            statusEl.textContent = "저장되었습니다.";
            setTimeout(() => (statusEl.textContent = ""), 1500);
        }
    });
}

init().catch((e) => {
    console.error(e);
    statusEl.textContent = "초기화 실패";
});

import "./style.css";
import { loadSettings, parseSettings, saveSettings, Settings, SettingsSchema } from "../shared/settings";
import { LlmProvider } from "../llm_request/llm-request";

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
        const rawSettings: Settings = {
            provider: providerEl.value as LlmProvider,
            model: modelEl.value.trim(),
            apiKey: apiKeyEl.value.trim(),
            targetLanguage: targetLanguageEl.value.trim(),
            contentFontSize: parseInt(contentFontSizeEl.value),
        };

        if (!rawSettings.model) {
            statusEl.textContent = "Model을 입력하세요.";
        } else if (!rawSettings.apiKey) {
            statusEl.textContent = "API Key를 입력하세요.";
        } else if (!rawSettings.targetLanguage) {
            statusEl.textContent = "Target Language를 입력하세요.";
        } else {
            const newSettings = parseSettings(rawSettings);
            await saveSettings(newSettings);
            statusEl.textContent = "저장되었습니다.";
            setTimeout(() => (statusEl.textContent = ""), 1500);
        }
    });
}

init().catch((e) => {
    console.error(e);
    statusEl.textContent = "에러: 저장된 설정을 불러오지 못했습니다.";
});

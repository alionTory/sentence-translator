type LlmProvider = "google" | "mock";

type Settings = {
    targetLanguage: string;
    provider: LlmProvider;
    model: string;
    apiKey: string;        
    contentFontSize: number;
};

const DEFAULT_SETTINGS: Settings = {
    provider: "google",
    model: "gemini-2.5-flash",
    apiKey: "",
    targetLanguage: "한국어",
    contentFontSize: 16,
};

const STORAGE_KEY = "settings";

/**
 * 사용자 클라우드 저장소로부터 확장 프로그램 설정을 얻어 반환.
 * 설정된 값이 클라우드에 없으면, 기본 설정값을 반환.
 */
async function loadSettings(): Promise<Settings> {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const settings = result[STORAGE_KEY];
    if (settings) {
        return { ...DEFAULT_SETTINGS, ...settings };
    } else {
        return DEFAULT_SETTINGS;
    }
}

/**
 * 사용자 클라우드 저장소에 확장 프로그램 설정을 저장.
 */
async function saveSettings(settings: Settings): Promise<void> {
    await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
}

export type { LlmProvider, Settings }
export { loadSettings, saveSettings }
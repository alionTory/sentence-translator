import { LlmProviderSchema } from "../llm_request/llm-request";
import * as z from "zod";

const DEFAULT_SETTINGS = {
    provider: "google",
    model: "gemini-2.5-flash",
    apiKey: "",
    targetLanguage: "한국어",
    contentFontSize: 16,
} as const;

const SettingsSchema = z.object({
    provider: LlmProviderSchema.catch(DEFAULT_SETTINGS.provider),
    model: z.string().catch(DEFAULT_SETTINGS.model),
    apiKey: z.string().catch(DEFAULT_SETTINGS.apiKey),
    targetLanguage: z.string().catch(DEFAULT_SETTINGS.targetLanguage),
    contentFontSize: z.number().min(5).max(100).catch(DEFAULT_SETTINGS.contentFontSize),
});

type Settings = z.infer<typeof SettingsSchema>;

const STORAGE_KEY = "settings";

/**
 * rawSettings가 Settings 타입에 부합하는지 런타임 검증하여 반환.
 * 존재하지 않거나 허용되지 않는 필드값은 기본값으로 설정되어 반환됨.
 */
function parseSettings(rawSettings: unknown): Settings {
    const parseResult = SettingsSchema.safeParse(rawSettings);
    if (parseResult.success) {
        return parseResult.data;
    } else {
        return DEFAULT_SETTINGS
    }
}

/**
 * 사용자 클라우드 저장소로부터 확장 프로그램 설정을 얻어 반환.
 * 설정된 값이 클라우드에 없으면, 기본 설정값을 반환.
 */
async function loadSettings(): Promise<Settings> {
    const storedData = await chrome.storage.sync.get(STORAGE_KEY);
    return parseSettings(storedData[STORAGE_KEY]);
}

/**
 * 사용자 클라우드 저장소에 확장 프로그램 설정을 저장.
 */
async function saveSettings(settings: Settings): Promise<void> {
    await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
}

export type { Settings }
export { parseSettings, loadSettings, saveSettings, SettingsSchema }
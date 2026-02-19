import { TooltipView } from "./tooltip-view";
import { LlmRequester, GeminiReqeuster, OpenAiRequester } from "../llm_request/llm-request";
import { loadSettings, Settings } from "../shared/settings";
import { LlmTranslator } from "../translator/llm-translator";
import { TooltipController } from "./tooltip-controller";

const settings = await loadSettings();

function createLlmRequester(settings: Settings): LlmRequester {
    switch (settings.provider) {
        case "google":
            return new GeminiReqeuster(settings.apiKey);
        case "openai":
            return new OpenAiRequester(settings.apiKey);
        default:
            throw new Error(`Unknown provider: ${settings.provider}`);
    }
}

const llmRequester: LlmRequester = createLlmRequester(settings);
llmRequester.setModel(settings.model);

const llmTranslator = new LlmTranslator(llmRequester, settings.targetLanguage);

const POPUP_ID = "__sel_popup_ext__";

const tooltipView = new TooltipView(POPUP_ID);
tooltipView.hide();
tooltipView.setFontSize(settings.contentFontSize);

const tooltipController = new TooltipController(tooltipView, llmTranslator);

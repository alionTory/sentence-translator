import "./style.css";
import { PopupArea } from "./popup-view";
import { LlmRequester, LlmRequesterMock, GeminiReqeuster } from "../llm_request/llm-request";
import { loadSettings, LlmProvider, Settings } from "../shared/settings";

const settings =  await loadSettings();

function createLlmRequester(settings: Settings): LlmRequester {
    switch (settings.provider) {
        case "mock":
            return new LlmRequesterMock();
        case "google":
            return new GeminiReqeuster(settings.apiKey, settings.model);
        default:
            throw new Error(`Unknown provider: ${settings.provider}`);
    }
}

const llmRequester: LlmRequester = createLlmRequester(settings);

const POPUP_ID = "__sel_popup_ext__";

class PopupContent {
    private _translatedText = ""
    private static readonly DEFAULT_FONT_SIZE = 16;
    private _fontSize = PopupContent.DEFAULT_FONT_SIZE;

    setTranslatedText(text: string) {
        this._translatedText = text;
    }

    setFontSize(fontSize: number) {
        this._fontSize = fontSize;
    }

    getHtmlElement(): HTMLElement {
        const result = document.createElement("div");
        result.innerText = this._translatedText;
        result.style.fontSize = `${this._fontSize}px`;
        return result;
    }
}

const popupArea = new PopupArea(POPUP_ID);
const popupContent = new PopupContent();
popupContent.setFontSize(settings.contentFontSize);

/**
 * 사용자가 html 문서에서 "유효한" 영역을 드래그로 선택한 상태인 경우, 해당 선택 영역을 반환.
 * 선택 영역이 존재하지 않거나 유효하지 않은 경우, null을 반환.
 * 선택 영역이 유효하다는 것은, 선택된 텍스트에서 공백을 제외한 부분이 비어 있지 않다는 의미임.
 */
function tryGetValidSelection(): Selection | null {
    const sel = window.getSelection();
    if (sel !== null && sel.toString().trim().length > 0) {
        return sel;
    }
    return null;
}

async function translateSelectionAndShowPopup(selection: Selection) {
    const text = selection.toString().trim();
    const rect = selection.getRangeAt(0).getBoundingClientRect();

    await llmRequester.translateText(text, settings.targetLanguage);
    let translatedText = "";
    if (llmRequester.isLastRequestOk()) {
        translatedText = llmRequester.translationResult();
    } else {
        console.log(llmRequester.errorMessage());
        translatedText = llmRequester.errorMessage();
    }

    popupContent.setTranslatedText(translatedText);

    popupArea.display();
    popupArea.setContent(popupContent.getHtmlElement());
    popupArea.setNearRectangleArea(rect);
}


// 드래그 후 mouseup 시점에 선택 텍스트를 읽어 팝업 표시
document.addEventListener("mouseup", async (e) => {
    console.log("mouseup event detected");
    const sel = tryGetValidSelection();
    if (e.ctrlKey && sel) {
        await translateSelectionAndShowPopup(sel);
    } else {
        popupArea.hide();
    }
},
    { capture: true }
);

// ESC로 닫기
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") popupArea.hide();
});

// 빈 곳 클릭하면 닫기 (팝업 클릭은 유지)
document.addEventListener(
    "mousedown",
    (e) => {
        popupArea.hide();
    },
    { capture: true }
);


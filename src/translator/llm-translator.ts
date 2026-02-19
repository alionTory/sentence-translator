import { LlmRequester } from "../llm_request/llm-request";
import { StringBuffer } from "../llm_request/string-buffer";

/**
 * LLM 에게 번역을 요청하고 번역 결과를 받음.
 */
class LlmTranslator {
    private _llmRequester: LlmRequester;
    private _targetLanguage: string;

    /**
     * 생성 과정에서 llmRequester의 적절한 시스템 프롬프트를 설정함.
     */
    constructor(llmRequester: LlmRequester, targetLanguage: string) {
        this._llmRequester = llmRequester;
        this._targetLanguage = targetLanguage;

        this._llmRequester.setSystemPrompt(this.getSystemPrompt());
    }

    private getSystemPrompt(): string {
        let result: string | null = null;

        switch (this._llmRequester.getProvider()) {
            case "google":
            case "openai":
                result = `당신은 전문 번역가입니다. 텍스트가 입력으로 주어지면 이를 ${this._targetLanguage}로 번역하세요.`
                break;
        }

        return result;
    }

    /**
     * llm에 문자열 text를 targetLanguage로 번역 요청.
     * 번역 결과는 StringBuffer 객체를 통해 얻을 수 있음.     
     */
    translateText(text: string): StringBuffer{
        return this._llmRequester.request({ lastUserPrompt: text });
    }

}

export { LlmTranslator };
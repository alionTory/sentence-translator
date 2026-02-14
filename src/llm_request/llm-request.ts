import { GenerateContentResponse, GoogleGenAI } from "@google/genai"

abstract class LlmRequester {
    protected _translationResult = "";
    /**
     * 마지막 요청에 대한 응답을 정상적으로 얻었을 경우 true 리턴.
     * 에러 발생 시 false 리턴.
     */
    abstract isLastRequestOk(): boolean;

    /**
     * 에러 메시지 리턴
     */
    abstract errorMessage(): string;

    /**
     * llm에 문자열 text를 targetLanguage로 번역 요청.
     * 번역 결과는 translationResult() 를 통해 구할 수 있음.
     */
    abstract translateText(text: string, targetLanguage: string): Promise<void>;

    /**
     * translateSentences() 로 번역한 결과를 리턴.
     * @require isLastRequestOk()
     */
    translationResult(): string {
        return this._translationResult;
    }
}

class LlmRequesterMock extends LlmRequester {
    isLastRequestOk(): boolean {
        return true;
    }

    errorMessage(): string {
        return "Error occurred during LLM request.";
    }

    async translateText(text: string, targetLanguage: string): Promise<void> {
        this._translationResult = `[Mocked Translation to ${targetLanguage}]: ${text}`;
    }
}

class GeminiReqeuster extends LlmRequester {
    private _errorMessage = "GeminiRequester가 생성된 이후 LLM 요청 메서드가 실행되지 않음"
    private _lastReqeustOk = false
    private _ai;
    private _model;

    constructor(apiKey: string, model: string) {
        super();
        this._ai = new GoogleGenAI({ "apiKey": apiKey });
        this._model = model;
    }

    private systemInstruction(targetLanguage: string) {
        return `당신은 전문 번역가입니다. 텍스트가 입력으로 주어지면 이를 ${targetLanguage}로 번역하세요.`;
    }

    isLastRequestOk(): boolean {
        return this._lastReqeustOk;
    }

    errorMessage(): string {
        return this._errorMessage;
    }

    async translateText(text: string, targetLanguage: string): Promise<void> {
        try {
            const response = await this._ai.models.generateContent({
                model: this._model,
                contents: text,
                config: {
                    systemInstruction: this.systemInstruction(targetLanguage),
                },
            });
            
            if(response.text !== undefined) {
                this._translationResult = response.text;
                this._lastReqeustOk = true;
            } else {
                this._lastReqeustOk = false;
                this._errorMessage = `LLM이 응답 생성을 거부했습니다. 전체 응답: ${JSON.stringify(response)}`;
            }
        } catch (e) {
            this._lastReqeustOk = false;
            this._errorMessage = `LLM 요청 중 오류 발생: ${e}`;
            return;
        }
    }
}

export { LlmRequester, LlmRequesterMock, GeminiReqeuster };
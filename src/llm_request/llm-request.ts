import { GoogleGenAI } from "@google/genai"
import OpenAI from "openai";
import { StringBuffer } from "./string-buffer";
import * as z from "zod";

type LlmRequest = {
    lastUserPrompt: string;
}

const LlmProviderSchema = z.literal(["google", "openai"]);
type LlmProvider = z.infer<typeof LlmProviderSchema>;

abstract class LlmRequester {
    protected _systemPrompt = ""
    protected abstract _modelId: string;

    /**
     * 사용할 모델명을 modelId로 설정.
     */
    setModel(modelId: string): void {
        this._modelId = modelId;
    }

    /**
     * 시스템 프롬프트를 systemPrompt로 설정.
     */
    setSystemPrompt(systemPrompt: string): void {
        this._systemPrompt = systemPrompt;
    }

    /**
     * Llm provider 종류를 반환.
     */
    abstract getProvider(): LlmProvider;

    /**
     * LlmRequest에 담긴 프롬프트를 바탕으로 llm에 요청을 보냄.
     * 요청 결과는 StringBuffer 객체를 통해 얻을 수 있음.
     * 반환된 StringBuffer 객체는 전체 결과를 얻기까지 여러 차례 부분 갱신이 이루어질 수도 있음 (예: 스트림 응답).
     */
    abstract request(llmRequest: LlmRequest): StringBuffer;
}

class GeminiReqeuster extends LlmRequester {
    private _ai;
    protected _modelId: string;

    static readonly DEFAULT_MODEL = "gemini-2.5-flash"

    constructor(apiKey: string) {
        super();
        this._ai = new GoogleGenAI({ "apiKey": apiKey });
        this._modelId = GeminiReqeuster.DEFAULT_MODEL;
    }

    getProvider(): LlmProvider {
        return "google";
    }

    request(llmRequest: LlmRequest): StringBuffer {
        const result = new StringBuffer();

        this._ai.models.generateContentStream({
            model: this._modelId,
            contents: llmRequest.lastUserPrompt,
            config: {
                systemInstruction: this._systemPrompt,
            },
        }).then(async value => {
            for await (const chunk of value) {
                if (chunk.text !== undefined) {
                    result.append(chunk.text);
                } else {
                    throw new Error(`전체 응답: ${JSON.stringify(chunk)}`)
                }
            }
        }).catch(error => {
            result.setErrorMessage(`LLM 요청 중 에러 발생: ${error}`);
        });

        return result;
    }
}

class OpenAiRequester extends LlmRequester {
    private _ai;
    protected _modelId: string;

    static readonly DEFAULT_MODEL = "gpt-5-mini"

    constructor(apiKey: string) {
        super();
        this._ai = new OpenAI({ "apiKey": apiKey, "dangerouslyAllowBrowser": true });
        this._modelId = GeminiReqeuster.DEFAULT_MODEL;
    }

    getProvider(): LlmProvider {
        return "google";
    }

    request(llmRequest: LlmRequest): StringBuffer {
        const result = new StringBuffer();

        this._ai.responses.create({
            model: this._modelId,
            input: [
                {
                    role: "system",
                    content: this._systemPrompt,
                },
                {
                    role: "user",
                    content: llmRequest.lastUserPrompt,
                },
            ],
            stream: true,
        }).then(async stream => {
            for await (const event of stream) {
                switch (event.type) {
                    case "response.output_text.delta":
                        result.append(event.delta);
                        break;
                    case "response.failed":
                        throw new Error(JSON.stringify(event.response.error));
                        break;
                    case "error":
                        throw new Error(JSON.stringify(event))
                        break;
                    default:
                        break;
                }
            }
        }).catch(error => {
            result.setErrorMessage(`LLM 요청 중 에러 발생: ${error}`);
        });

        return result;
    }
}

export { LlmRequester, GeminiReqeuster, OpenAiRequester, LlmProviderSchema };
export type { LlmProvider };
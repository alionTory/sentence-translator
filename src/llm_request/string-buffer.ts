import { Observer } from "../util/observer";

/**
 * 문자열을 저장하는 버퍼. 
 * 하나의 Observer 객체를 등록할 수 있음.
 * 문자열이 갱신될 때마다, 등록된 Observer 객체에 대해 update를 호출.
 */
class StringBuffer {
    private _observer: Observer | null = null;
    private _buffer: string;
    private _errorMessage: string | null;

    constructor() {
        this._buffer = "";
        this._errorMessage = null;
    }

    /**
     * observer를 등록함.
     * 기존에 등록된 Observer는 등록 취소됨.
     */
    setObserver(observer: Observer) {
        this._observer = observer;
    }

    /**
     * 버퍼 끝에 텍스트를 추가.
     */
    append(text: string) {
        this._buffer += text;
        this.notify();
    }

    /**
     * 현재 버퍼에 저장된 문자열을 반환
     */
    get content() {
        return this._buffer;
    }

    /**
     * 버퍼에서 내용을 입력받는 중 발생한 에러 메시지를 반환.
     * @require isErrorExist()
     */
    getErrorMessage(): string {
        // this._errorMessage가 null일 때 ""를 리턴한다는 것에 의존하지 마시오.
        return this._errorMessage ?? "";
    }

    /**
     * 에러 메시지를 설정.
     * @ensure isErrorExist()
     */
    setErrorMessage(errorMessage: string) {
        this._errorMessage = errorMessage;
        this.notify();
    }

    /**
     * 버퍼에서 내용을 입력받는 중 에러가 발생했는지 여부 반환.
     */
    isErrorExist() {
        return this._errorMessage !== null;
    }

    /**
     * 등록된 Observer 객체가 존재한다면, 해당 객체로 update를 호출함.
     */
    private notify(): void {
        if (this._observer !== null)
            this._observer.update(this);
    }
}

export { StringBuffer }
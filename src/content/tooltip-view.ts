import tooltipHtml from "./tooltip.html?raw";
import tooltipCss from "./tooltip.css?raw";
import { addDragAndDropEventHandler } from "../util/register-handler-helper";

type TooltipViewComponent = "headerBlank" | "resizeHandle" | "closeButton";

/**
 * html 문서에서 툴팁이 표시될 직사각형 영역을 나타냄.
 */
class TooltipView {
    static readonly DEFAULT_WIDTH = 720;
    static readonly MIN_WIDTH = 60;


    private _shadowHost: HTMLDivElement;
    private _html: HTMLDivElement;
    private _contentContainer: HTMLDivElement;

    private _width = TooltipView.DEFAULT_WIDTH;
    private _left = 0;
    private _top = 0;

    /**
     * 문서에 주어진 id 값을 가지는 팝업 요소를 생성
     */
    constructor(id: string) {
        // 루트 element 생성
        this._shadowHost = document.createElement("div");
        this._shadowHost.id = id;
        this._shadowHost.style.overflow = "visible";

        const shadow = this._shadowHost.attachShadow({ mode: "open" });

        const style = document.createElement("style");
        style.textContent = tooltipCss;
        shadow.appendChild(style);

        const htmlTemplate = document.createElement("template");
        htmlTemplate.innerHTML = tooltipHtml;
        shadow.appendChild(htmlTemplate.content.cloneNode(true));

        this._html = shadow.querySelector(".tooltip") as HTMLDivElement;
        this._contentContainer = this._html.querySelector(".tooltip__content") as HTMLDivElement;

        // 문서 body에 추가
        document.body.appendChild(this._shadowHost);

        this.setWidth(TooltipView.DEFAULT_WIDTH);
    }

    /**
     * 툴팁에 표시되는 내용의 폰트 크기를 설정.
     */
    setFontSize(fontSize: number) {
        this._contentContainer.style.fontSize = `${fontSize}px`;
    }


    /**
     * 주어진 문자열을 팝업 영역에 표시
     */
    setContent(content: string) {
        this._contentContainer.innerHTML = content;
    }


    /**
     * 문서에서 팝업이 보이도록 함.
     * @ensure isVisible()
     */
    display() {
        this._shadowHost.style.display = "block";
    }

    /**
     * 문서에서 팝업을 숨김.
     * @ensure !isVisible()
     */
    hide() {
        this._shadowHost.style.display = "none";
    }

    /**
     * 팝업이 문서에서 보이는지 여부 반환.
     */
    isVisible() {
        return this._shadowHost.style.display !== "none";
    }

    /**
     * 툴팁의 너비를 설정. px 기준.
     * 높이는 너비에 맞게 자동 조정됨.
     * width < PopupView.MIN_WIDTH 인 경우, 너비가 PopupView.MIN_WIDTH로 설정됨.
     */
    setWidth(width: number) {
        this._width = Math.max(TooltipView.MIN_WIDTH, width);
        this._html.style.width = `${this._width}px`;
    }

    /**
     * 툴팁의 왼쪽, 오른쪽 끝이 뷰포트 너비를 넘지 않도록,
     * 툴팁의 가로 위치와 너비를 조정함.
     * @ensure 툴팁의 너비가 뷰포트 너비보다 작다면, 툴팁의 너비는 변하지 않음.
     */
    makeWidthWithinViewPort() {
        const viewPortLeft = 0;
        const viewPortRight = viewPortLeft + document.documentElement.clientWidth;

        if (this.left + this.width > viewPortRight) {
            this.setLeft(Math.max(viewPortRight - this.width, viewPortLeft));
        }
        if (this.left + this.width > viewPortRight) {
            this.setWidth(viewPortRight - this.left);
        }
    }


    /**
     * 툴팁 영역의 너비. px 기준.
     * 기본값 : TooltipView.MIN_WIDTH
     */
    get width() {
        return this._width;
    }


    /**
     * 뷰포트에서 툴팁의 왼쪽 위치. px 기준.
     */
    get left() {
        return this._left;
    }

    /**
     * 뷰포트에서 툴팁의 위쪽 위치. px 기준.
     */
    get top() {
        return this._top;
    }

    /**
     * 객체에 저장된 위치 데이터를 실제 DOM에 적용
     */
    private applyPosition() {
        this._html.style.transform = `translate(${this.left}px, ${this.top}px)`;
    }

    /**
     * 뷰포트에서 툴팁의 왼쪽 위치를 px 기준으로 설정.
     * 툴팁 요소의 position은 fixed라고 가정.
     */
    setLeft(left: number) {
        this._left = left;
        this.applyPosition();
    }

    /**
     * 뷰포트에서 툴팁의 위쪽 위치를 px 기준으로 설정.
     * 툴팁 요소의 position은 fixed라고 가정.
     */
    setTop(top: number) {
        this._top = top;
        this.applyPosition();
    }


    /**
     * 툴팁을 나타내는 DOM이 eventTarget을 포함하는지를 리턴
     */
    contains(eventTarget: EventTarget | null): boolean {
        return eventTarget instanceof Node && this._shadowHost.contains(eventTarget);
    }

    /**
     * 툴팁을 나타내는 DOM과 range가 겹치는지를 리턴
     */
    overlaps(range: Range): boolean {
        return range.intersectsNode(this._shadowHost);
    }

    /**
     * 주어진 component에 대응하는 DOM 요소를 반환
     */
    private getDomElement(component: TooltipViewComponent) {
        let result: HTMLDivElement | null = null;

        switch (component) {
            case "headerBlank":
                result = this._html.querySelector(".tooltip__header-blank");
                break;
            case "resizeHandle":
                result = this._html.querySelector(".tooltip__resize-handle");
                break;
            case "closeButton":
                result = this._html.querySelector(".tooltip__close");
                break;
        }

        if (result === null)
            throw new Error(`툴팁 DOM 내에서 컴포넌트 ${component}를 찾지 못함.`)

        return result;
    }

    /**
     * 툴팁의 DOM내 특정 컴포넌트에 이벤트 핸들러를 등록함.
     * @param component 툴팁 DOM 내의 컴포넌트를 지칭.
     * @param eventType 이벤트의 종류를 나타내는 문자열.
     * @param handler component에서 eventType 이벤트 발생 시 실행될 콜백.
     */
    addEventHandler(component: TooltipViewComponent,
        eventType: keyof HTMLElementEventMap, handler: (e: Event) => void) {

        const domElement = this.getDomElement(component);
        domElement.addEventListener(eventType, handler);
    }

    /**
     * 툴팁의 DOM내 특정 컴포넌트에 드래그 앤 드롭 이벤트 핸들러를 등록함.
     * @param component 툴팁 DOM 내의 컴포넌트를 지칭.
     * @param onDragAfterClick 사용자가 component를 클릭한 상태에서 드래그하는 동안 매 프레임마다 호출되는 콜백 함수.
     * @param onClick 사용자가 component를 클릭하면 호출되는 콜백 함수.
     */
    addDragAndDropEventHandler(component: TooltipViewComponent,
        onDragAfterClick: (e: PointerEvent) => void,
        onClick: (e: PointerEvent) => void = () => { }) {

        const domElement = this.getDomElement(component);
        addDragAndDropEventHandler(domElement, onDragAfterClick, onClick);
    }
}


export { TooltipView };
export type { TooltipViewComponent };
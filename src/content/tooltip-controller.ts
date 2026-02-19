import { TooltipView } from "./tooltip-view"
import { LlmTranslator } from "../translator/llm-translator";
import { StringBuffer } from "../llm_request/string-buffer";
import { Observer } from "../util/observer";
import { throttlingHandler } from "../util/register-handler-helper";

/**
 * 다음을 담당함.
 * - TooltipView 내부에서 감지한 사용자 입력을 전달받음.
 * - TooltipView 외부에서 발생한 사용자 입력을 감지함.
 * - 특정 사용자 입력에 따라 TooltipView 수정.
 * - 특정 사용자 입력에 따라 LlmTranslator에 요청하고, StringBuffer를 받음.
 * - StringBuffer가 갱신됨에 따라, TooltipView 수정.
 */
class TooltipController implements Observer {
    // @invariant _tooltipMovedAfterOpen 이 거짓이면, _selectedRange !== null

    /**
     * 툴팁을 띄울 위치와 선택 영역 사이의 간격. px 단위.
     */
    static readonly TOOLTIP_SELECTION_GAP = 8;

    private _translationBuffer: StringBuffer | null = null;

    /**
     * 툴팁 창이 openTooltip()으로 열린 직후에는 false이고,
     * 툴팁 창 헤더 드래그로 인해 위치가 이동한 이후 true가 됨.
     * 
     * 툴팁 헤더 드래그 앤 드롭 이후에는, 사용자가 툴팁 창 바깥을 클릭해도 툴팁 창이 닫히지 않고,
     * 스크롤 시 뷰포트 위치가 바뀌지 않도록 하는 용도.
     */
    private _tooltipMovedAfterOpen = true;

    /**
     * 사용자가 ctrl 키를 누른 상태에서 드래그로 선택한 영역,
     * 툴팁을 띄우게 만든 바로 그 부분의 영역을 나타내는 값.
     */
    private _selectedRange: Range | null = null;

    constructor(private _tooltipView: TooltipView, private _llmTranslator: LlmTranslator) {
        this.registerDragResizeHandleEventHandler();
        this.registerDragHeaderEventHandler();
        this.registerScrollEventHandler();
        this.registerDragTextEventHandler();
        this.registerTooltipClose();
    }

    /**
     * 사용자가 html 문서 텍스트를 드래그하여 선택하고 ctrl 키를 누른 채로 포인터를 때면,
     * 툴팁을 띄우고 번역된 텍스트를 출력하도록,
     * 이벤트 핸들러를 등록함.
     */
    private registerDragTextEventHandler() {
        document.addEventListener("pointerup", async (e) => {
            if (e.pointerType === "mouse" && e.button !== 0) return;

            const selection = tryGetValidSelection();
            if (e.ctrlKey && selection && !this._tooltipView.overlaps(selection.getRangeAt(0))) {
                const text = selection.toString().trim();
                const selectedRange = selection.getRangeAt(0);

                this._translationBuffer = this._llmTranslator.translateText(text);
                this._translationBuffer.setObserver(this);

                this.openTooltip(selectedRange);
            }
        },
            { capture: true }
        );
    }

    /**
     * 툴팁창 오른쪽 가장자리를 드래그해서 너비를 조절하는 핸들러를 등록하는 헬퍼 함수
     */
    private registerDragResizeHandleEventHandler() {
        this._tooltipView.addDragAndDropEventHandler("resizeHandle", (e) => {

            this._tooltipView.setWidth(e.clientX - this._tooltipView.left);
        })
    }

    /**
     * 사용자가 툴팁 창 헤더 부분을 클릭하고 드래그할 시,
     * 툴팁 창이 따라서 움직이는 핸들러를 등록하는 헬퍼 함수.
     */
    private registerDragHeaderEventHandler() {
        let initialClickX = 0;
        let initialClickY = 0;

        let initialLeft = 0;
        let initialTop = 0;

        this._tooltipView.addDragAndDropEventHandler("headerBlank", (e) => {
            const displacementX = e.clientX - initialClickX;
            const displacementY = e.clientY - initialClickY;

            this._tooltipView.setLeft(initialLeft + displacementX);
            this._tooltipView.setTop(initialTop + displacementY);
        }, (e) => {
            initialClickX = e.clientX;
            initialClickY = e.clientY;

            initialLeft = this._tooltipView.left;
            initialTop = this._tooltipView.top;

            this._tooltipMovedAfterOpen = true;
        });
    }

    /**
     * _tooltipMovedAfterOpen이 false 인 경우, 
     * 스크롤 시 툴팁이 문서 내용에 고정되어 움직이도록 함.
     */
    private registerScrollEventHandler() {
        /*
        콜백으로 this.method가 아니라 () => this.method() 를 넘겨줘야 this가 undefined가 되는 것을 막을 수 있음.

        passive: true는 이벤트 핸들러가 preventDefault를 호출하지 않음을
        브라우저에게 알려 줌. 스크롤 성능 개선에 도움됨.
        */
        window.addEventListener("scroll", throttlingHandler(() => this.recalculateCoordinate()),
            { passive: true, capture: true });

        window.addEventListener("resize", throttlingHandler(() => this.recalculateCoordinate()), { passive: true });
    }

    /**
     * 적절한 이벤트들에 대해, 툴팁 창을 닫는 동작 closeTooltip()을 등록.
     */
    private registerTooltipClose() {
        // ESC로 닫기
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") this.closeTooltip();
        });

        // X 버튼을 클릭하여 닫기
        this._tooltipView.addEventHandler("closeButton", "click", (e) => {
            this.closeTooltip();
        })

        // _tooltipMovedAfterOpen이 false이고, 사용자가 tooltipView 영역 밖을 클릭한 경우, 툴팁을 닫음.
        document.addEventListener(
            "pointerdown",
            (e) => {
                if (e.pointerType === "mouse" && e.button !== 0) return;
                if (e.target instanceof Node && this._tooltipView.contains(e.target)) return;
                if (this._tooltipMovedAfterOpen) return;

                this.closeTooltip();
            },
            { capture: true }
        );
    }

    /**
     * _tooltipMovedAfterOpen가 false일 경우, 툴팁이 사용자 선택 영역 _selectedRange 밑에 있도록 유지하기 위해 위치 조정.
     */
    private recalculateCoordinate() {
        if (!this._tooltipMovedAfterOpen && this._selectedRange) {
            const rect = this._selectedRange.getBoundingClientRect();
            this._tooltipView.setLeft(rect.left);
            this._tooltipView.setTop(rect.bottom + TooltipController.TOOLTIP_SELECTION_GAP);
            this._tooltipView.makeWidthWithinViewPort();
        }
    }

    /**
     * 주어진 선택 영역 아래쪽에 툴팁창을 염.
     * 툴팁 창 내의 내용은 비움.
     * @ensure !_tootipMovedAfterOpen
     * @ensure _selectedRage !== null
     */
    private openTooltip(range: Range) {
        // cloneRange() 안하면, 사용자 드래그에 따라 Range 객체 상태가 바뀔 수 있음.
        this._selectedRange = range.cloneRange();
        this._tooltipMovedAfterOpen = false;

        this.recalculateCoordinate();

        this._tooltipView.setContent("");
        this._tooltipView.display();
    }

    /**
     * 툴팁 창을 숨기고, _translationBuffer를 등록 해제함.
     */
    private closeTooltip() {
        this._tooltipView.hide();
        this._translationBuffer = null;
    }

    /**
     * subject가 TooltipController 인스턴스 내에 등록되어 있을 경우, 
     * subject의 내용을 읽어 TooltipView에 표시함.
     */
    update(subject: Object): void {
        if (this._translationBuffer === subject) {
            let translatedText = this._translationBuffer.content;

            if (this._translationBuffer.isErrorExist())
                translatedText += this._translationBuffer.getErrorMessage();

            this._tooltipView.setContent(translatedText);
        }
    }
}


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

export { TooltipController };
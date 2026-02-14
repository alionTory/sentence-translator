/**
 * html 문서에서 팝업이 표시될 직사각형 영역을 나타냄.
 */
class PopupArea {
    static readonly DEFAULT_WIDTH = 360
    private el: HTMLDivElement;
    private _width = PopupArea.DEFAULT_WIDTH;

    /**
     * 주어진 html 요소를 팝업 영역에 표시
     */
    setContent(content: HTMLElement) {
        this.el.innerHTML = content.outerHTML;
    }

    /**
     * 문서에 주어진 id 값을 가지는 팝업 요소를 생성
     */
    constructor(id: string) {
        // 루트 element 생성
        this.el = document.createElement("div");
        this.el.id = id;

        this.setWidth(PopupArea.DEFAULT_WIDTH);

        // 문서 루트에 추가
        document.documentElement.appendChild(this.el);

        // 주의 : appendChild 이전에는 offsetHeight 값이 0.
        this._height = this.el.offsetHeight;
    }

    /**
     * 문서에서 팝업이 보이도록 함.
     * @ensure isVisible()
     */
    display() {
        this.el.style.display = "block";
    }

    /**
     * 문서에서 팝업을 숨김.
     * @ensure !isVisible()
     */
    hide() {
        this.el.style.display = "none";
    }

    /**
     * 팝업이 문서에서 보이는지 여부 반환.
     */
    isVisible() {
        return this.el.style.display !== "none";
    }

    /**
     * 팝업의 너비를 설정. px 기준.
     * 높이는 너비에 맞게 자동 조정됨.
     * @require width는 음수가 아니여야 함.
     */
    setWidth(width: number) {
        this._width = width;
        this.el.style.width = `${width}px`;
    }


    /**
     * 팝업 영역의 너비. px 기준.
     * 기본값 : PopupArea.DEFAULT_WIDTH
     */
    get width() {
        return this._width;
    }

    /**
     * 팝업의 왼쪽 상단이 문서 내 (left px, top px) 위치에 오도록 설정.
     * 팝업 요소의 position은 fixed라고 가정.
     */
    setDocumentPosition(left: number, top: number) {
        this.el.style.left = `${left}px`;
        this.el.style.top = `${top}px`;
    }


    /**
     * 주어진 직사각형 영역 rect 아래쪽에 팝업을 위치시킴.
     * - 팝업의 왼쪽 끝은 뷰포트 너비 안에 위치해야 함.
     * - 팝업의 너비가 뷰포트 너비보다 작다면, 팝업의 오른쪽 끝은 뷰포트 너비 안에 위치해야 함.
     * - 팝업과 선택 영역 사이는 상하 8px 간격이 있음.
     */
    setNearRectangleArea(rect: DOMRect) {
        const gap = 8;

        const viewPortLeft = 0;
        const viewPortRight = viewPortLeft + document.documentElement.clientWidth;
        const viewPortBottom = document.documentElement.clientHeight;


        let left = rect.left;

        // 팝업의 오른쪽 끝이 뷰포트를 넘으면, 뷰포트 안에 오도록 함.
        left = Math.min(left, viewPortRight - this.width)

        // 팝업의 왼쪽 끝이 뷰포트를 넘으면, 뷰포트 안에 오도록 함.
        left = Math.max(left, viewPortLeft)

        let top = rect.bottom + gap;

        this.setDocumentPosition(left, top);
    }
}

export { PopupArea };

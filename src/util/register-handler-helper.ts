/**
 * 이벤트 핸들러 handler를 requestAnimationFrame으로 throttling을 하는 버전으로 수정하여 리턴.
 */
function throttlingHandler<E extends Event>(handler: (e: E) => void) {
    let ticking = false;

    return (event: E) => {
        if (!ticking) {
            requestAnimationFrame(() => {
                handler(event);
                ticking = false;
            });
            ticking = true;
        }
    }
}

/**
 * 사용자가 html 요소 element를 클릭하면 onClick이 호출되고,
 * 클릭한 상태로 드래그하면 onDragAfterClick가 매 프레임(requestAnimationFrame)마다 호출되도록,
 * 콜백 onclick과 onDragAfterClick를 등록하는 헬퍼 함수.
 */
function addDragAndDropEventHandler(element: HTMLElement,
    onDragAfterClick: (e: PointerEvent) => void,
    onClick: (e: PointerEvent) => void = () => { }) {

    let pressedPointerId: number | null = null;

    const onPointerDown = (e: PointerEvent) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;

        pressedPointerId = e.pointerId;
        // 커서가 요소 밖으로 나가도 이벤트를 받을 수 있도록 pointer capture 설정
        element.setPointerCapture(pressedPointerId);

        // 드래그 중 텍스트 선택 방지
        document.body.style.userSelect = "none";

        onClick(e);
    };

    const throttlingOnDragAfterClick = throttlingHandler(onDragAfterClick);

    const onPointerMove = (e: PointerEvent) => {
        // 눌린 상태의 포인터가 존재해야 하므로, pressedPointerId가 null이 아니여야 함.
        // 멀티터치 환경에서 동일한 손가락을 식별하기 위해, pressedPointerId와 e.pointerId가 같아야 함.
        if (pressedPointerId === e.pointerId) {
            throttlingOnDragAfterClick(e);
        }
    };

    const endDragAndDrop = (e: PointerEvent) => {
        if (pressedPointerId && pressedPointerId === e.pointerId) {
            element.releasePointerCapture(pressedPointerId);
            pressedPointerId = null;
            document.body.style.userSelect = "";
        }
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", endDragAndDrop);
    element.addEventListener("pointercancel", endDragAndDrop);
}

export { addDragAndDropEventHandler, throttlingHandler };
/**
 * Modal/Sheet/Menu 닫기 직후 다음 프레임에 콜백을 실행한다.
 *
 * 의도(intent) — 함부로 제거하지 말 것:
 * 메뉴 항목 탭 → 메뉴 close() 가 진행 중일 때 onPress 가 동기적으로 실행되면
 * 다른 Modal 혹은 BottomSheet 가 동시에 떠 z-index 충돌 / 백드롭 잔상 / 키보드
 * 누락 등이 발생한다. 한 프레임만 양보해도 첫 Modal 의 dismiss 가 마무리되어
 * 안정적으로 다음 시트가 mount 된다.
 *
 * 적용 위치: `SectionCardMenu`, `NoticeContextMenu`.
 */
export function runAfterFrame(cb: () => void): void {
    requestAnimationFrame(cb);
}

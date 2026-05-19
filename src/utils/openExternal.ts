import * as WebBrowser from 'expo-web-browser';

import { colors } from '../ui/theme';

/**
 * 외부 URL 을 인앱 브라우저로 연다.
 *
 * `Linking.openURL` 은 앱을 떠나 Safari/Chrome 으로 이동시키지만,
 * `WebBrowser.openBrowserAsync` 는 시스템 인앱 브라우저(iOS SFSafariViewController /
 * Android Custom Tabs) 를 모달처럼 띄워 앱 컨텍스트를 유지한다.
 *
 *  - 다크 테마 톤에 맞춰 toolbar / controls 색상 지정 (Android Custom Tabs).
 *  - iOS 는 시스템 표준 시트 형태 — 사용자 친숙한 UX.
 *  - 실패해도 silent (사용자가 cancel 했거나 URL 이 유효하지 않을 때).
 */
export async function openExternalUrl(url: string): Promise<void> {
    try {
        await WebBrowser.openBrowserAsync(url, {
            // Android Custom Tabs toolbar color — 다크 톤
            toolbarColor: colors.bgTop,
            controlsColor: colors.accent,
            // iOS dismiss 버튼 스타일 — '닫기' 라벨 명시
            dismissButtonStyle: 'close',
            // iOS 시트 표시 (전체 화면이 아닌 모달형) — 컨텍스트 유지에 유리
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        });
    } catch {
        // 사용자 취소 / URL 무효 / 플랫폼 미지원 — silent
    }
}

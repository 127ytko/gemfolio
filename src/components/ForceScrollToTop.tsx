'use client';

import { useEffect } from 'react';

export function ForceScrollToTop() {
    useEffect(() => {
        // 即時実行
        window.scrollTo(0, 0);

        // ブラウザのスクロール復元処理を上書きするために少し遅延させて再実行
        const timer = setTimeout(() => {
            window.scrollTo(0, 0);
        }, 50);

        return () => clearTimeout(timer);
    }, []);

    return null;
}

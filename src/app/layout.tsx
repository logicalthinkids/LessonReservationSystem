import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "体験会予約システム | Logical Thinkids",
    description: "プログラミング体験会の予約をスムーズに。管理も利用者もストレスフリーなシステム。",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja" suppressHydrationWarning>
            <body suppressHydrationWarning>{children}</body>
        </html>
    );
}

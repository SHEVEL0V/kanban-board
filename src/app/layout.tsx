import type { Metadata } from "next";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { ThemeRegistry } from "@/shared/ui/theme-registry";
import { DictionaryProvider } from "@/shared/i18n/dictionary-context";
import { getDictionary } from "@/shared/i18n/get-dictionary";
import { font } from "@/config/font";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanban Board",
  description: "Kanban board built with Next.js, MUI and Prisma",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { dict, locale } = await getDictionary();

  return (
    <html lang={locale} className={font.className} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="data" />
        <ThemeRegistry>
          <DictionaryProvider dict={dict} locale={locale}>
            {children}
          </DictionaryProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}

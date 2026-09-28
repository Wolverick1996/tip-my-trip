import type { Metadata } from "next"
import { MantineProvider, mantineHtmlProps } from "@mantine/core"
import { ModalsProvider } from "@mantine/modals"
import { Notifications } from "@mantine/notifications"
import { Lora } from "next/font/google"
import localFont from "next/font/local"
import "./globals.css"
import { MainNav } from "./MainNav"
import { theme } from "./theme"

const googleSans = localFont({
  src: "./fonts/google-sans-latin.woff2",
  variable: "--font-google-sans",
})

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "TipMyTrip",
  description: "Trova chi conosce davvero la tua prossima destinazione.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${googleSans.variable} ${lora.variable} h-full antialiased`} {...mantineHtmlProps}>
      <body className="min-h-full flex flex-col">
        <MantineProvider theme={theme} forceColorScheme="light">
          <ModalsProvider>
            <Notifications />
            <MainNav />
            {children}
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  )
}

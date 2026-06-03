import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from 'sonner'

import './globals.css'
import NavBar from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Stark Health — Voice-first dog PT care',
  description:
    'Coordinate your dog physical therapy and mobility care through voice. Stark Health structures daily PT work for your whole care team.',
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NavBar />
            {children}
            <Analytics />
            <Toaster richColors position="top-center" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

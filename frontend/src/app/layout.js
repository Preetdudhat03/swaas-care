import './globals.css';

export const metadata = {
  title: 'SwaasCare — AI Voice Biomarker Health Tracking',
  description:
    'Track your health daily through voice biomarkers. SwaasCare uses AI to analyze vocal patterns for disease progression monitoring — non-invasive, continuous, and intelligent.',
  keywords: [
    'voice biomarker',
    'health tracking',
    'AI healthcare',
    'vocal analysis',
    'disease monitoring',
    'SwaasCare',
  ],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#c8d4f7',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

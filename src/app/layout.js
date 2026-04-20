export const metadata = {
  title: "TrendPulse — Fabian Stores",
  description: "Real-time product trend tracker for West African e-commerce",
  manifest: "/manifest.json",
  themeColor: "#06071A",
  icons: {
    apple: "/icon-192.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#06071A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TrendPulse" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#06071A" }}>
        {children}
      </body>
    </html>
  );
}

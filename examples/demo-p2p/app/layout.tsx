export const metadata = {
  title: "uWu SDK · Demo P2P",
  description: "Minimal P2P-style demo of @uwu-protocol/checkout — pay INR, get an on-chain proof on Algorand.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: "linear-gradient(180deg, #fef6ee 0%, #fde4d0 100%)",
        minHeight: "100vh",
        color: "#1a1a1a",
      }}>
        {children}
      </body>
    </html>
  );
}

import "./globals.css";

export const metadata = {
  title: "Sindhi Mess Menu",
  description: "Daily mess menu for Sindhi Mess",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
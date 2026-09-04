import React from 'react';
import './globals.css';

export const metadata = {
  title: 'AuraFund - Direct Local Crowdfunding',
  description: 'Instant Mobile Money fundraising platform for Uganda',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

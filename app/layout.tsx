import type { Metadata } from "next";
import {  Geist_Mono, Jersey_10 } from "next/font/google";
import "./globals.css";
import { GlobalContextProvider } from "./context/GlobalContext";
import {Sidebar} from "./components/Sidebar";


const jersey10 = Jersey_10({
  weight: "400", // Add the weight property
  variable: "--font-jersey-10",
  subsets: ["latin"]
});


export const metadata: Metadata = {
  title: "Liars Poker",
  description: "by Swarna Nagrani and Ishita Mishra",
  icons: {
    icon: "/logo.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
      className={`${jersey10.variable} ${jersey10.variable}`}
      >
        <GlobalContextProvider>
          <div className="flex">
            <div className="p-5 px-12">

            <Sidebar />
            </div>
            <main className="flex-1">
              {children}
            </main>
          </div>
        </GlobalContextProvider>
      </body>
    </html>
  );
}

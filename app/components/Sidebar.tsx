"use client"

import { Home, Layers, PlayCircle, User, BookOpen, Wallet, LogOut, SwitchCamera } from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation";
import { cn } from "../utils/cn";
import { useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import Image from 'next/image';

const navigation = [
  {
    name: "Home",
    href: "/",
    icon: Home
  },
  {
    name: "Join",
    href: "/joingames",
    icon: Layers
  },
  {
    name: "Tutorials",
    href: "/tutorials",
    icon: PlayCircle
  },
  {
    name: "Login",
    href: "/login",
    icon: User
  },
  {
    name: "Rules",
    href: "/rules",
    icon: BookOpen
  }
]

export function Sidebar() {
  const pathname = usePathname();
  const { walletAddress, isWalletConnected, connectWallet, disconnectWallet, setShowAlert }: any = useGlobalContext();
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const handleWalletClick = () => {
    if (!isWalletConnected) {
      connectWallet();
    } else {
      setShowWalletMenu(!showWalletMenu);
    }
  };

  const handleSwitchWallet = async () => {
    try {
      await disconnectWallet();
      await new Promise(resolve => setTimeout(resolve, 100));
      await connectWallet();
      setShowWalletMenu(false);
    } catch (error) {
      console.error('Error switching wallet:', error);
      setShowAlert({
        status: true,
        type: 'error',
        message: 'Error switching wallet. Please try again.',
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setShowWalletMenu(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  return (
    <div className="flex h-screen w-24 flex-col items-center border-r border-zinc-800 bg-zinc-950/95 py-8 backdrop-blur-sm z-10 fixed top-0 left-0">
      {/* Game Logo */}
      <div className="mb-8">
        <Image src="/favicon.ico" alt="Liar's Poker" className="w-12 h-12" width={100} height={100} />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-zinc-900/50 transition-all hover:bg-[#98C23D]/20 hover:scale-105",
                isActive && "bg-[#98C23D]/20 shadow-lg shadow-[#98C23D]/20 "
              )}
            >
              <item.icon
                className={cn(
                  "h-6 w-6 text-zinc-400 transition-colors group-hover:text-[#98C23D]",
                  isActive && "text-[#98C23D]"
                )}
              />
              <span
                className={cn(
                  "absolute -bottom-5 text-2xl font-medium text-zinc-400 transition-colors group-hover:text-[#98C23D] text-center",
                  isActive && "text-[#98C23D]"
                )}
              >
                {item.name}
              </span>
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-[#98C23D]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Updated Wallet Connection Section */}
      <div className="mt-auto pt-6 w-full px-3 relative">
        {!isWalletConnected ? (
          <button
            onClick={handleWalletClick}
            className="w-full group relative flex flex-col items-center justify-center rounded-xl 
                     bg-[#98C23D]/10 hover:bg-[#98C23D]/20 transition-all hover:scale-105 py-4
                     border border-[#98C23D]/30 hover:border-[#98C23D]/50"
          >
            <Wallet className="h-6 w-6 text-[#98C23D] mb-1" />
            <span className="text-xs font-medium text-[#98C23D]">
              Connect
            </span>
          </button>
        ) : (
          <div className="w-full flex flex-col items-center gap-2">
            <button
              onClick={handleWalletClick}
              className="w-full py-3 px-2 rounded-xl bg-[#98C23D]/10 border border-[#98C23D]/30
                       hover:bg-[#98C23D]/20 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#98C23D] animate-pulse" />
                <span className="text-2xl text-[#98C23D] truncate">
                  {`${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`}
                </span>
              </div>
            </button>

            {/* Wallet Menu Dropdown */}
            {showWalletMenu && (
              <div className="absolute bottom-full mb-2 w-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden z-20">
                <button
                  onClick={handleSwitchWallet}
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-zinc-800 transition-colors"
                >
                  <SwitchCamera className="h-4 w-4 text-[#98C23D]" />
                  <span className="text-2xl text-zinc-300">Switch Wallet</span>
                </button>
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-zinc-800 transition-colors
                           border-t border-zinc-800"
                >
                  <LogOut className="h-4 w-4 text-red-400" />
                  <span className="text-2xl text-zinc-300">Disconnect</span>
                </button>
              </div>
            )}

            <div className="w-3 h-3 rounded-full bg-[#98C23D]/20 animate-ping" />
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {showWalletMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowWalletMenu(false)}
        />
      )}
    </div>
  )
}


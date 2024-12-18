"use client";

import { useState } from 'react';
import { Press_Start_2P } from 'next/font/google';
import { useGlobalContext } from '@/app/context/GlobalContext';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel'
});

const FloatingNumber = ({ children, className }: { children: string, className: string }) => (
  <div className={`absolute font-[var(--font-minecraft)] text-4xl text-gray-800/10 animate-float ${className}`}>
    {children}
  </div>
);

export default function Home() {
  const { isWalletConnected, connectWallet, walletAddress, contract } = useGlobalContext();
  const [username, setUsername] = useState('');
  const [aadhar, setAadhar] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWalletConnected) return;
    const registeredPlayers = await contract?.registeredPlayers(walletAddress);
    if(await registeredPlayers.isRegistered == true){
        alert("You are already registered");
        return;
    }
    const tx = await contract?.registerPlayer();
    // Here you can interact with your smart contract
    console.log({ username, aadhar, walletAddress });
  };

  return (
    <div className={`min-h-screen bg-[#0A0A0A] ${pixelFont.variable}`}>
      {/* Floating Numbers Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingNumber className="top-[10%] left-[5%] animate-float-slow">A</FloatingNumber>
        <FloatingNumber className="top-[45%] left-[15%] animate-float-delayed">K</FloatingNumber>
        <FloatingNumber className="top-[75%] left-[8%] animate-float">Q</FloatingNumber>
        <FloatingNumber className="top-[20%] right-[12%] animate-float-slow">J</FloatingNumber>
      </div>

      <div className="p-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto mt-16 relative z-10">
          {/* Title */}
          <h1 className="text-white text-6xl md:text-8xl font-[var(--font-pixel)] tracking-tighter leading-none animate-fade-in mb-12">
            LIAR'S POKER
          </h1>

          {/* Login Form */}
          <div className="max-w-md mx-auto bg-zinc-900/80 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:outline-none focus:border-[#98C23D] transition-colors"
                  placeholder="Enter your username"
                />
              </div>

              {/* Aadhar Field */}
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Aadhar for ZK Verification</label>
                <input
                  type="text"
                  value={aadhar}
                  onChange={(e) => setAadhar(e.target.value)}
                  className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:outline-none focus:border-[#98C23D] transition-colors"
                  placeholder="Enter your Aadhar number"
                />
              </div>

              {/* Wallet Connection */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <div className={`w-2 h-2 rounded-full ${isWalletConnected ? 'bg-[#98C23D]' : 'bg-red-500'} animate-pulse`} />
                  {isWalletConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
                </div>
                {!isWalletConnected && (
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="px-4 py-2 text-sm bg-zinc-800 text-[#98C23D] rounded-lg hover:bg-zinc-700 
                             transition-colors border border-[#98C23D]/30 hover:border-[#98C23D]"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isWalletConnected}
                className={`w-full text-black text-lg px-8 py-4 rounded-lg font-medium 
                         transition-all hover:scale-105 flex items-center justify-center gap-2
                         ${isWalletConnected 
                           ? 'bg-[#98C23D] hover:bg-[#88b22d] hover:shadow-lg hover:shadow-[#98C23D]/20' 
                           : 'bg-zinc-600 cursor-not-allowed'}`}
              >
                {isWalletConnected ? 'Start Playing' : 'Connect Wallet to Play'}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7-7 7"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] opacity-40">
          <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-[#98C23D]/20 via-zinc-800/20 to-transparent rounded-tl-full" />
          <div className="absolute bottom-24 right-24 w-48 h-48 bg-[#98C23D]/30 rounded-tl-[64px] blur-xl" />
        </div>

        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]" />
      </div>
    </div>
  );
}

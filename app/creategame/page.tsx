'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalContext } from '@/app/context/GlobalContext';
import { ethers } from "ethers";

// Floating number component for background effect
const FloatingNumber = ({
  children,
  className,
}: {
  children: string;
  className: string;
}) => (
  <div
    className={`absolute font-[var(--font-minecraft)] text-4xl text-gray-800/10 animate-float ${className}`}
  >
    {children}
  </div>
);

export default function CreateGame() {
  const router = useRouter();
  const { isWalletConnected, connectWallet, walletAddress, contract } = useGlobalContext();
  const [playerCount, setPlayerCount] : any = useState(2);
  const [entryFee, setEntryFee]: any = useState(100);
  const [isCreating, setIsCreating] = useState(false);
  const [gameMode, setGameMode] = useState<'video' | 'ai'>('video');

  const handleCreateGame = async () => {
    if (!walletAddress || !contract) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setIsCreating(true);
      console.log("Creating game with player count:", playerCount);
      
      // Convert entry fee to Wei (assuming entryFee is in ETH)
      const entryFeeInWei = ethers.parseEther(entryFee.toString());
      
      // Call the contract function with the required parameters
      const tx = await contract.createGameRoom(
        entryFeeInWei,  // _minBid parameter
        playerCount     // _numberOfPlayers parameter
      );
      
      const receipt = await tx.wait();
      console.log("Receipt:", receipt);
      
      // Get the interface and find RoomCreated event
      const iface = contract.interface;
      const roomCreatedEvent = receipt.logs.find(
        (log: any) => {
          try {
            const parsed = iface.parseLog(log);
            return parsed?.name === 'RoomCreated';
          } catch (e) {
            return false;
          }
        }
      );
      
      // Parse the event to get the room ID
      const parsedEvent = iface.parseLog(roomCreatedEvent);
      const roomId = parsedEvent?.args?.[0];
      console.log("Room ID:", roomId);

      if (!roomId) {
        throw new Error('Failed to get room ID');
      }

      // Redirect to the gameplay page with the new room ID
      router.push(`/gameplay/${roomId}`);
    } catch (error: any) {
      console.error('Error creating game:', error);
      // Provide more specific error messages based on the error
      if (error?.message?.includes("Minimum bid is too low")) {
        alert('Entry fee is too low. Please increase the amount.');
      } else if (error?.message?.includes("Invalid number of players")) {
        alert('Invalid number of players. Please choose between 2 and 8 players.');
      } else {
        alert('Failed to create game. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#0A0A0A]`}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]" />

      {/* Floating Numbers Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none text-white">
        <FloatingNumber className="top-[15%] left-[10%] animate-float-slow text-white">A</FloatingNumber>
        <FloatingNumber className="top-[40%] left-[20%] animate-float-delayed text-white">K</FloatingNumber>
        <FloatingNumber className="top-[70%] left-[15%] animate-float text-white">Q</FloatingNumber>
        <FloatingNumber className="top-[25%] right-[15%] animate-float-slow text-white">J</FloatingNumber>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 min-h-screen flex flex-col">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-[18vh] md:text-7xl text-white font-[var(--font-pixel)] mb-6 animate-fade-in">
            Create a new Liar's Poker
          </h1>
          <p className="text-zinc-400 text-5xl">Set up your perfect game</p>
        </div>

        {/* Game Creation Form */}
        <div className="max-w-3xl w-full mx-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Player Count Input */}
            <div className="group bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-8 border border-zinc-800 hover:border-[#98C23D]/50 transition-all">
              <label className="block text-zinc-400 text-3xl mb-4">
                Number of Players
              </label>
              <input
                type="number"
                min="2"
                max="8"
                value={playerCount}
                onChange={(e) => setPlayerCount(Math.min(8, Math.max(2, parseInt(e.target.value))))}
                className="w-full bg-zinc-900 text-[#98C23D] border border-zinc-700 rounded-lg px-6 py-4 text-3xl focus:outline-none focus:border-[#98C23D] transition-all"
                placeholder="2-8 players"
              />
            </div>

            {/* Initial Stake Input */}
            <div className="group bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-8 border border-zinc-800 hover:border-[#98C23D]/50 transition-all">
              <label className="block text-zinc-400 text-3xl mb-4">
                Minimum Bid (HBAR)
              </label>
              <input
                type="number"
                min="100"
                value={entryFee}
                onChange={(e) => setEntryFee(Math.max(100, parseInt(e.target.value)))}
                className="w-full bg-zinc-900 text-[#98C23D] border border-zinc-700 rounded-lg px-6 py-4 text-3xl focus:outline-none focus:border-[#98C23D] transition-all"
                placeholder="Minimum $100"
              />
            </div>
          </div>

          {/* Game Mode Selection */}
          <div className="mb-12">
            <h3 className="text-white text-5xl font-[var(--font-pixel)] mb-8 text-center">
              Select Game Mode
            </h3>

            <div className="space-y-6">
              {/* Video & Voice Option */}
              <div 
                onClick={() => setGameMode('video')}
                className="group cursor-pointer bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-8 border border-zinc-800 hover:border-[#98C23D]/50 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="w-8 h-8 rounded-full border-2 border-[#98C23D] flex items-center justify-center">
                    <div className={`w-4 h-4 rounded-full ${gameMode === 'video' ? 'bg-[#98C23D]' : 'bg-transparent'}`} />
                  </div>
                  <div>
                    <h4 className="text-white text-3xl mb-2">Video & Voice</h4>
                    <p className="text-zinc-400">
                      Full immersive experience with video and voice chat
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Text Chat Option */}
              <div 
                onClick={() => setGameMode('ai')}
                className="group cursor-pointer bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-8 border border-zinc-800 hover:border-[#98C23D]/50 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="w-8 h-8 rounded-full border-2 border-zinc-700 flex items-center justify-center">
                    <div className={`w-4 h-4 rounded-full ${gameMode === 'ai' ? 'bg-[#98C23D]' : 'bg-transparent'}`} />
                  </div>
                  <div>
                    <h4 className="text-white text-3xl mb-2">AI Text Chat</h4>
                    <p className="text-zinc-400">
                      Play with AI-powered chat for a unique experience
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateGame}
            disabled={isCreating}
            className={`w-full bg-[#98C23D] hover:bg-[#88b22d] text-black text-3xl px-8 py-6 rounded-lg font-medium 
                       transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#98C23D]/20
                       flex items-center justify-center gap-3 group
                       ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>{isCreating ? 'Creating Game...' : 'Create Game'}</span>
            {!isCreating && (
              <svg
                className="w-6 h-6 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
              </svg>
            )}
          </button>

          {/* Bottom Stats */}
          <div className="mt-12 flex justify-center gap-12 text-zinc-400">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#98C23D]/50 animate-ping" />
              <span className="text-3xl">Games Created Today: 24</span>
            </div>
            <div className="text-3xl">
              Average Stakes: <span className="text-[#98C23D]">$500</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

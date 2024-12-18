"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { useGlobalContext } from '@/app/context/GlobalContext';

interface GameRoom {
  roomId: number;
  creator: string;
  currentState: number;
  creationTimestamp: number;
  currentBid: {
    player: string;
    rank: number;
    suit: number;
    amount: number;
    timestamp: number;
  };
  currentTurn: string;
  lastBidder: string;
  winner: string;
  totalPrizePool: number;
  exists: boolean;
}

export default function JoinBid() {
  const router = useRouter();
  const { isWalletConnected, connectWallet, walletAddress, contract } = useGlobalContext();
  const [activeGames, setActiveGames] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGames = async () => {
      if (!contract) {
        console.log("Contract not initialized");
        setLoading(false);
        return;
      }

      try {
        const allRoomIds = await contract.getActiveGameRooms();
        console.log("Room IDs:", allRoomIds);

        if (!allRoomIds) {
          setActiveGames([]);
          setLoading(false);
          return;
        }

        const activeRoomsPromises = allRoomIds.map(async (roomId: number) => {
          const roomDetails = await contract.gameRooms(roomId);
          console.log("roomDetails:", roomDetails);
          return {
            roomId: roomId,
            creator: roomDetails[1],
            currentState: roomDetails[2],
            creationTimestamp: roomDetails[3],
            currentBid: {
              player: roomDetails[4][0],
              rank: roomDetails[4][1],
              suit: roomDetails[4][2],
              amount: roomDetails[4][3],
              timestamp: roomDetails[4][4],
            },
            currentTurn: roomDetails[5],
            lastBidder: roomDetails[6],
            winner: roomDetails[7],
            totalPrizePool: roomDetails[8],
            exists: roomDetails[9],
          };
        });

        const allRooms = await Promise.all(activeRoomsPromises);
        console.log("allRooms:", allRooms);
        const activeRooms = allRooms.filter((room) => Number(room.currentState) === 0 || Number(room.currentState) === 1);
        setActiveGames(activeRooms);
        console.log("activeRooms:", activeRooms);
        setLoading(false);
      } catch (error) {
        console.error("Error loading games:", error);
        setLoading(false);
      }
    };

    loadGames();
  }, [contract]);

  const handleJoinGame = async (roomId: number) => {
    if (!walletAddress || !contract) {
      console.log("Wallet not connected or contract not initialized");
      return;
    }

    try {
      console.log("Joining room:", roomId);
      const joinFee = ethers.parseEther("0.0001"); // Convert 0.0001 ETH to Wei
      const tx = await contract.joinGameRoom(roomId, { value: joinFee });
      await tx.wait(); // Wait for transaction to be mined
      
      // Navigate to gameplay page after successful join
      router.push(`/gameplay/${roomId}`);
    } catch (error) {
      alert("Already joined this table");
    }
  };

  return (
    <div className={`min-h-screen bg-[#0A0A0A]`}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]" />

      <div className="relative z-10 p-8">
        {/* Header Section */}
        <h1 className="text-4xl md:text-[15vh] text-white  mb-4 ">
          Available Tables
        </h1>
        <p className="text-zinc-400 text-[5vh] mb-12 py-4 ">
          Choose your table and join the game
        </p>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="text-white text-7xl">Loading games...</div>
          ) : activeGames.length === 0 ? (
            <div className="text-zinc-400 text-7xl">No active games available.....</div>
          ) : (
            activeGames.map((game) => (
              <div
                key={game.roomId}
                className="group bg-gradient-to-r  from-zinc-900 to-zinc-800 rounded-xl p-6 hover:scale-[1.02] 
                         transition-all duration-300 border border-zinc-800 hover:border-[#98C23D]/50"
              >
                {/* Room Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-5xl text-white font-semibold ">
                    Room #{game.roomId}
                  </h2>
                  <div className="px-3 py-1 rounded-full bg-[#98C23D]/20 text-[#98C23D] text-sm">
                    Active
                  </div>
                </div>

                {/* Room Details */}
                <div className="space-y-2 text-3xl text-zinc-400 mb-4">
                  <div className="flex justify-between">
                    <span>Creator</span>
                    <span className="text-[#98C23D]">
                      {game.creator.slice(0, 6)}...{game.creator.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between text-3xl">
                    <span>Prize Pool</span>
                    <span className="text-[#98C23D] ">
                      {ethers.formatEther(game.totalPrizePool)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between text-3xl">
                    <span>Created</span>
                    <span>
                      {new Date(Number(game.creationTimestamp) * 1000).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Join Button */}
                <button
                  onClick={() => handleJoinGame(game.roomId)}
                  className="w-full bg-[#98C23D] hover:bg-[#88b22d] text-black px-6 py-3 rounded-lg 
                           font-medium transition-all duration-300 hover:scale-105 
                           hover:shadow-lg hover:shadow-[#98C23D]/20"
                >
                  Join Table
                </button>
              </div>
            ))
          )}
        </div>

        {/* Stats Footer */}
        <div className="mt-12 flex gap-8 text-zinc-400 text-3xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#98C23D]/50 animate-ping" />
            <span>{activeGames.length} Active Games</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useGlobalContext } from '@/app/context/GlobalContext';
import React from 'react';
import { FaVideo, FaMicrophone, FaHistory } from 'react-icons/fa';
import { BsChatDots } from 'react-icons/bs';
import { motion } from 'framer-motion';
import { RiHashtag } from 'react-icons/ri';
import { ethers } from "ethers";

// Enhanced ParticipantCircle component
const ParticipantCircle = ({ 
  player, 
  position, 
  totalPlayers, 
  isCurrentTurn,
  status,
  lastAction 
}: any) => {
  const angle = (position * 360) / totalPlayers;
  const baseRadius = 200;
  const radius = totalPlayers <= 4 ? baseRadius : baseRadius * (4 / totalPlayers);
  const circleSize = totalPlayers <= 4 ? 130 : Math.max(50, 80 * (4 / totalPlayers));
  
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
      style={{ 
        left: `calc(50% + ${x}px)`, 
        top: `calc(50% + ${y}px)`,
        width: `${circleSize}px`,
        height: `${circleSize}px`
      }}
    >
      <div 
        className={`relative w-full h-full rounded-full flex flex-col items-center justify-center
          transition-all duration-300 border-2 hover:scale-110 group
          ${isCurrentTurn 
            ? 'bg-[#98C23D]/20 border-[#98C23D] scale-110 shadow-lg shadow-[#98C23D]/20' 
            : 'bg-zinc-800/50 border-zinc-700'
          }`}
      >
        {/* Status Indicator */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full 
          ${status === 'active' ? 'bg-[#98C23D]' : 'bg-zinc-500'} 
          animate-pulse`} 
        />
        
        {/* Player Address */}
        <span className="text-3xl text-white mb-1">
          {player.slice(0, 6)}...
        </span>
        
        {/* Last Action Tooltip */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
          bg-zinc-800 px-2 py-1 rounded text-3xl text-white whitespace-nowrap
          opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {lastAction}
        </div>
      </div>
    </div>
  );
};

interface Bid {
  player: string;
  quantity: number;
  digit: number;
  timestamp: string;
}

interface GameState {
  players: string[];
  currentTurn: string;
  currentBid: any;
  myNumber: string | null;
  gameStatus: string;
  [key: string]: any;
}

export default function GameplayPage({ params }: { params: Promise<{ id: string }> }) {
  // Correctly unwrap params
  const resolvedParams = React.use(params);
  const { contract, walletAddress } = useGlobalContext();
  const [gameState, setGameState]: any = useState({
    players: [],
    currentTurn: '',
    currentBid: null,
    myNumber: null,
    gameStatus: 1
  });
  const [bidInput, setBidInput] = useState({ digit: 0, quantity: 1, betAmount: 0 });
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{player: string, message: string}>>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [bidsHistory, setBidsHistory] = useState<Bid[]>([
    { player: "0x1234...5678", quantity: 3, digit: 8, timestamp: "2 mins ago" },
    { player: "0x8765...4321", quantity: 4, digit: 5, timestamp: "3 mins ago" },
    { player: "0x9876...1234", quantity: 2, digit: 7, timestamp: "5 mins ago" },
  ]);
  const [mySerialNumber, setMySerialNumber] = useState("0000000000");
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winner, setWinner]: any = useState<{
    address: string;
    amount: string;
    reason: string;
  } | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  
  useEffect(() => {
    const updateGameState = async () => {
      if (!contract || !walletAddress) return;

      try {
        const roomDetails = await contract.getGameRoomDetails(resolvedParams.id);
        const currentPlayers = roomDetails.players;
        const currentTurn = roomDetails.currentTurn;
        
        setPlayers(currentPlayers);
        setGameState((prev: GameState) => ({
          ...prev,
          players: currentPlayers,
          currentTurn,
          gameStatus: roomDetails.currentState,
          prizePool: roomDetails.prizePool
        }));
        console.log("gameState", gameState);

        // Check if it's the current player's turn
        setIsMyTurn(currentTurn.toLowerCase() === walletAddress.toLowerCase());
        
        // Update current turn index
        const turnIndex = currentPlayers.findIndex(
          (player: string) => player.toLowerCase() === currentTurn.toLowerCase()
        );
        setCurrentTurnIndex(turnIndex);


        const getPlayerDetails = await contract.getPlayerDetails(resolvedParams.id, walletAddress);
        console.log("getPlayerDetails", getPlayerDetails);
        const playerSerialNumber = getPlayerDetails[2];
        console.log("playerSerialNumber", playerSerialNumber);
        setMySerialNumber(playerSerialNumber);


      } catch (error) {
        console.error("Error updating game state:", error);
      }
    };

    updateGameState();

    // Set up real-time updates
    if (contract) {
      contract.on("GameStarted", updateGameState);
      contract.on("BidPlaced", updateGameState);
      contract.on("LiarCalled", updateGameState);
      contract.on("GameEnded", updateGameState);
      contract.on("PlayerJoined", updateGameState);
      contract.on("TurnChanged", updateGameState);

      return () => {
        contract.off("GameStarted", updateGameState);
        contract.off("BidPlaced", updateGameState);
        contract.off("LiarCalled", updateGameState);
        contract.off("GameEnded", updateGameState);
        contract.off("PlayerJoined", updateGameState);
        contract.off("TurnChanged", updateGameState);
      };
    }
  }, [contract, walletAddress, resolvedParams.id]);


  // Game actions remain the same but use resolvedParams.id
  const handleMakeBid = async () => {
    try {
      if (!contract) return;
      const tx = await contract.placeBid(
        resolvedParams.id,
        bidInput.digit,
        bidInput.quantity,
        {
          value: ethers.parseEther(bidInput.betAmount.toString())
        }
      );
      await tx.wait();

      // Update the game state after successful bid
      setGameState((prev: any) => ({
        ...prev,
        currentBid: {
          digit: bidInput.digit,
          quantity: bidInput.quantity
        },
        lastActions: {
          ...prev.lastActions,
          [walletAddress]: `Bid ${bidInput.quantity}×${bidInput.digit}`
        }
      }));

      // Find the next player's turn
      const currentPlayerIndex = players.findIndex(
        (player: string) => player.toLowerCase() === walletAddress.toLowerCase()
      );
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
      
      // Update current turn
      setCurrentTurnIndex(nextPlayerIndex);
      setIsMyTurn(false);

      // Reset bid input
      setBidInput({ digit: 0, quantity: 1, betAmount: 0 });

      // Add to bids history
      setBidsHistory(prev => [{
        player: walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4),
        quantity: bidInput.quantity,
        digit: bidInput.digit,
        timestamp: "Just now"
      }, ...prev]);

    } catch (error) {
      console.error("Error making bid:", error);
    }
  };

  const handleCallLiar = async () => {
    try {
      if (!contract) return;
      
      // First call liar
      const tx = await contract.callLiar(resolvedParams.id);
      const receipt = await tx.wait();

      // Get the LiarCalled event from transaction receipt
      const liarCalledEvent = receipt.events?.find((e: any) => e.event === "LiarCalled");
      
      // After successful liar call, automatically reveal number
      await handleRevealNumber();

      // The GameEnded event will be emitted from determineWinner function
      // Listen for GameEnded event
      await contract.once("GameEnded", (roomId, winnerAddress, prizeAmount) => {
        setWinner({
          roomId: roomId,
          address: winnerAddress,
          amount: ethers.formatUnits(prizeAmount, 8),
          reason: "Successfully caught the liar!" 
        });
        setShowWinnerModal(true);
      });

    } catch (error) {
      console.error("Error calling liar:", error);
    }
  };
  if(contract) {
    contract.on("GameEnded", (roomId, winnerAddress, prizeAmount) => {
      setWinner({
        roomId: roomId,
        address: winnerAddress,
        amount: ethers.formatUnits(prizeAmount, 8),
        reason: "Successfully caught the liar!" 
      });
      setShowWinnerModal(true);
    });
  }
  const generateRandomSerialNumber = () => {
    let number = '';
    for (let i = 0; i < 6; i++) {
      number += Math.floor(Math.random() * 10).toString();
    }
    return number;
  };

  const handleStartGame = async () => {
    setIsStartingGame(true);
    try {
      if (!contract) return;

      // Get the number of active players
      const roomDetails = await contract.getGameRoomDetails(resolvedParams.id);
      const numberOfPlayers = roomDetails.players.length;

      // Generate random serial numbers for each player
      const serialNumbers = Array(numberOfPlayers).fill(0).map(() => {
        const serialNumber = generateRandomSerialNumber();
        return ethers.getBigInt(serialNumber);
      });

      console.log("Starting game with serial numbers:", serialNumbers);

      // Call the smart contract's startGame function
      const tx = await contract.startGame(
        resolvedParams.id,
        serialNumbers,
        {
          gasLimit: 1000000
        }
      );
      
      await tx.wait();

      // Update local game state
      setGameState((prev: GameState) => ({
        ...prev,
        gameStatus: 3
      }));

      // Add loading state and success notification if needed
      console.log("Game started successfully!");

    } catch (error) {
      console.error("Error starting game:", error);
      // Add error handling notification if needed
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleRevealNumber = async () => {
    setIsRevealing(true);
    try {
      if (!contract) return;
      const tx = await contract.revealNumber(resolvedParams.id);
      const receipt = await tx.wait();
      const winnerRevealed = receipt.events?.find((e: any) => e.event === "GameEnded");
      console.log("winnerRevealed", winnerRevealed);
      setShowWinnerModal(true);
      
      console.log("Number revealed successfully");
    } catch (error) {
      console.error("Error revealing number:", error);
    } finally {
      setIsRevealing(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#0A0A0A] `}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 p-8">
        <h1 className="text-center text-4xl md:text-[15vh] font-[var(--font-pixel)] text-[#98C23D] mb-16 animate-pulse">
          Game Room #{resolvedParams.id}
        </h1>

        {gameState  && (
          <div className="flex justify-center mb-16">
            <button
              onClick={handleStartGame}
              disabled={gameState.gameStatus ==1}
              className={`group relative inline-flex items-center justify-center px-8 py-3 
                ${isStartingGame 
                  ? 'bg-gray-500' 
                  : 'bg-gradient-to-r from-[#98C23D] to-[#7BA32F]'} 
                rounded-lg text-black font-semibold tracking-wider
                transform transition-all duration-300 ease-in-out
                hover:scale-105 active:scale-95
                shadow-lg hover:shadow-[#98C23D]/50
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="absolute inset-0 bg-white/30 rounded-lg blur opacity-0 
                group-hover:opacity-20 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2 text-3xl">
                {isStartingGame ? (
                  <>
                    Starting Game...
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  </>
                ) : (
                  <>
                    Start Game
                    <svg 
                      className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>
        )}

        <div className="flex">
          {/* Left Game Section */}
          <div className="flex-1">
            {/* Participants Circle */}
            <div className="relative h-[500px] flex items-center justify-center">
              {/* Center Bid Circle */}
              <div className="absolute w-48 h-48 rounded-full bg-zinc-900/80 border-2 border-[#98C23D] flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="text-3xl text-zinc-400">Current Bid</div>
                  <div className="text-3xl text-[#98C23D] font-bold">
                    {gameState.currentBid ? 
                      `${gameState.currentBid.quantity}×${gameState.currentBid.digit}` : 
                      '-'
                    }
                  </div>
                  {gameState.currentBid && (
                    <div className="text-xl text-zinc-400 mt-1">
                      Bet: {ethers.formatUnits(gameState.currentBid.bidAmount || 0, 8)} HBAR
                    </div>
                  )}
                  <div className="text-xl text-zinc-400 mt-1">
                    Pool: {ethers.formatUnits(gameState.prizePool || 0, 8)} HBAR
                  </div>
                </div>
              </div>

              {players.map((player, index) => (
                <motion.div
                  key={player}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 260,
                    damping: 20 
                  }}
                >
                  <ParticipantCircle
                    player={player}
                    position={index}
                    totalPlayers={players.length}
                    isCurrentTurn={currentTurnIndex === index}
                    status={player.toLowerCase() === walletAddress.toLowerCase() ? 'self' : 'active'}
                    lastAction={gameState.lastActions?.[player] || 'Waiting'}
                  />
                </motion.div>
              ))}
            </div>

            {/* Game Controls */}
            <div className="mt-8 max-w-md mx-auto">
              <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-6 backdrop-blur-sm">
                {/* Betting Amount Input */}
                <div className="mb-4">
                  <label className="block text-[#98C23D] text-3xl mb-2">Betting Amount (ETH)</label>
                  <input
                    type="number"
                    value={bidInput.betAmount || ''}
                    onChange={(e) => setBidInput(prev => ({ ...prev, betAmount: parseFloat(e.target.value) }))}
                    className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 
                      focus:border-[#98C23D] focus:ring-1 focus:ring-[#98C23D] transition-all"
                    placeholder="0.01"
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Bid Controls */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[#98C23D] text-3xl mb-2">The Digit For Bidding...</label>
                    <input
                      type="number"
                      value={bidInput.digit}
                      onChange={(e) => setBidInput(prev => ({ ...prev, digit: parseInt(e.target.value) }))}
                      className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 
                        focus:border-[#98C23D] focus:ring-1 focus:ring-[#98C23D] transition-all"
                      placeholder="0-9"
                      min="0"
                      max="9"
                    />
                  </div>
                  <div>
                    <label className="block text-[#98C23D] text-3xl mb-2">Number of Occurrences</label>
                    <input
                      type="number"
                      value={bidInput.quantity}
                      onChange={(e) => setBidInput(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                      className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 
                        focus:border-[#98C23D] focus:ring-1 focus:ring-[#98C23D] transition-all"
                      placeholder="Quantity"
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleMakeBid}
                    // disabled={!isMyTurn}
                    className={`flex-1 ${
                      isMyTurn 
                        ? 'bg-[#98C23D] hover:bg-[#88b22d]' 
                        : 'bg-gray-500 cursor-not-allowed'
                    } text-black px-6 py-3 rounded-lg 
                      transition-all duration-300 transform hover:scale-105 active:scale-95
                      font-semibold shadow-lg hover:shadow-[#98C23D]/20`}
                  >
                    Make Bid
                  </button>
                  <button
                    onClick={handleCallLiar}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                      text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 
                      active:scale-95 font-semibold shadow-lg hover:shadow-red-500/20"
                  >
                    Call Liar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-96 ml-8 flex flex-col gap-6">
            {/* Serial Number Section */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-zinc-900/90 to-zinc-800/90 border border-zinc-700 rounded-xl p-6 backdrop-blur-sm
                shadow-lg hover:shadow-[#98C23D]/20 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-4">
                <RiHashtag className="text-[#98C23D] text-3xl" />
                <h3 className="text-lg text-[#98C23D] font-semibold">Your Serial Number</h3>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(152,194,61,0.1)_50%,transparent_75%)] animate-shine" />
                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700 hover:border-[#98C23D] 
                  transition-all duration-300 group-hover:transform group-hover:scale-105">
                  <div className="grid grid-cols-10 gap-1">
                    {String(mySerialNumber)?.split('').map((digit, index) => (
                      <motion.div
                        key={index}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="w-7 h-9 bg-zinc-800 rounded flex items-center justify-center
                          border border-zinc-600 hover:border-[#98C23D] transition-all duration-300"
                      >
                        <span className="text-[#98C23D] font-bold">{digit}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-3xl text-zinc-500 text-center italic">
                Keep this number private! It's your game piece.
              </div>
            </motion.div>

            {/* Media Controls */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex gap-4 justify-center"
            >
              <button 
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`w-12 h-12 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-zinc-800'} 
                  hover:bg-[#98C23D] flex items-center justify-center transition-all duration-300
                  hover:scale-110 active:scale-95 shadow-lg hover:shadow-[#98C23D]/20`}
              >
                <FaVideo className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-full ${isMuted ? 'bg-red-500' : 'bg-zinc-800'} 
                  hover:bg-[#98C23D] flex items-center justify-center transition-all duration-300
                  hover:scale-110 active:scale-95 shadow-lg hover:shadow-[#98C23D]/20`}
              >
                <FaMicrophone className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Bids History Section */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <FaHistory className="text-[#98C23D]" />
                <h3 className="text-lg text-[#98C23D] font-semibold">Recent Bids</h3>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                {bidsHistory.map((bid, index) => (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 
                      transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#98C23D] animate-pulse" />
                      <span className="text-zinc-400 text-3xl">{bid.player}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#98C23D] font-bold">{bid.quantity}×{bid.digit}</span>
                      <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                        {bid.timestamp}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Chat Section - Enhanced */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex-1 bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <BsChatDots className="text-[#98C23D]" />
                <h3 className="text-lg text-[#98C23D] font-semibold">Chat</h3>
              </div>
              <div className="h-48 overflow-y-auto mb-4 space-y-2 custom-scrollbar">
                {chatHistory.map((msg, index) => (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    key={index}
                    className="text-3xl p-2 rounded-lg hover:bg-zinc-800/50 transition-all duration-300"
                  >
                    <span className="text-[#98C23D]">{msg.player}: </span>
                    <span className="text-zinc-300">{msg.message}</span>
                  </motion.div>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && chatMessage.trim()) {
                      setChatHistory(prev => [...prev, { player: walletAddress?.slice(0, 6) || 'Anonymous', message: chatMessage }]);
                      setChatMessage('');
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-3xl focus:outline-none focus:ring-2 focus:ring-[#98C23D]"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {showWinnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowWinnerModal(false)} 
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            className="relative z-10 bg-gradient-to-br from-zinc-900 to-zinc-800 
              rounded-2xl p-8 max-w-lg w-full mx-4 border border-[#98C23D]/30
              shadow-[0_0_50px_rgba(152,194,61,0.3)]"
          >
            {/* Confetti Effect */}
            <div className="absolute -inset-1">
              <div className="w-full h-full rotate-180 opacity-30 blur-sm"
                style={{
                  background: `
                    radial-gradient(circle at top left, #98C23D, transparent 50%),
                    radial-gradient(circle at top right, #7BA32F, transparent 50%),
                    radial-gradient(at bottom left, #98C23D, transparent 50%),
                    radial-gradient(at bottom right, #7BA32F, transparent 50%)
                  `
                }}
              />
            </div>

            {/* Content */}
            <div className="relative">
              {/* Trophy Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 
                    rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="text-4xl">🏆</span>
                </motion.div>
              </div>

              {/* Winner Text */}
              <h2 className="text-center text-3xl font-bold text-[#98C23D] mb-4">
                Winner!
              </h2>
              
              {/* Winner Address */}
              <div className="text-center mb-6">
                <div className="text-3xl text-white/90 mb-2">
                  {winner?.address.slice(0, 6)}{winner?.address.slice(-4)}
                </div>
                <div className="text-3xl text-zinc-400">
                  {winner?.reason}
                </div>
              </div>

              {/* Prize Amount */}
              <div className="bg-zinc-900/50 rounded-xl p-4 mb-6 text-center">
                <div className="text-3xl text-zinc-400 mb-1">Prize Pool</div>
                <div className="text-3xl font-bold text-[#98C23D]">
                  {winner?.amount} HBAR
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowWinnerModal(false)}
                className="w-full bg-gradient-to-r from-[#98C23D] to-[#7BA32F] 
                  text-black font-bold py-3 px-6 rounded-lg
                  transform transition-all duration-300
                  hover:scale-105 active:scale-95
                  shadow-lg hover:shadow-[#98C23D]/50"
              >
                Close
              </button>
            </div>

            {/* Animated Particles */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  opacity: 1
                }}
                animate={{
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 400 - 200,
                  scale: Math.random() * 2,
                  opacity: 0
                }}
                transition={{
                  duration: Math.random() * 2 + 1,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                style={{
                  background: i % 2 === 0 ? '#98C23D' : '#7BA32F'
                }}
              />
            ))}
          </motion.div>
        </div>
      )}

      {isRevealing && (
        <div className="text-center mt-4">
          <div className="animate-spin h-8 w-8 border-4 border-[#98C23D] border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-zinc-400">Revealing numbers...</p>
        </div>
      )}
    </div>
  );
}

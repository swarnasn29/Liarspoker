"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { useRouter } from 'next/navigation';

import { ABI, ADDRESS } from '../contract';
import { createEventListeners } from './createEventListeners';
import { GetParams, SwitchNetwork, isEthereum } from '../utils/onboard';
import { GameRoom } from '../types';

interface GlobalContextType {
  walletAddress: string;
  contract: ethers.Contract | null;
  gameRooms: GameRoom[];
  currentRoom: GameRoom | null;
  showAlert: {
    status: boolean;
    type: string;
    message: string;
  };
  isWalletConnected: boolean;
  connectWallet: () => Promise<void>;
  createRoom: () => Promise<void>;
  joinRoom: (roomId: number) => Promise<void>;
  placeBid: (roomId: number, digit: number, quantity: number) => Promise<void>;
  callLiar: (roomId: number) => Promise<void>;
  setShowAlert: (alert: { status: boolean; type: string; message: string }) => void;
  updateCurrentWalletAddress: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  currentTurn: string;
  gameStatus: string;
  handleTurnChange: (roomId: number) => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType>({} as GlobalContextType);

export const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [showAlert, setShowAlert] = useState({ status: false, type: 'info', message: '' });
  const [updateGameData, setUpdateGameData] = useState(0);
  const [step, setStep] = useState(-1);
  const [currentTurn, setCurrentTurn] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<string>('waiting');

  const router = useRouter();

  const connectWallet = async () => {
    try {
      if (!isEthereum()) {
        setShowAlert({
          status: true,
          type: 'error',
          message: 'Please install MetaMask!',
        });
        return;
      }

      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const newProvider = new ethers.BrowserProvider(connection);
      const signer = await newProvider.getSigner();
      const address = await signer.getAddress();
      const chainId = await (await newProvider.getNetwork()).chainId;

      setProvider(newProvider);
      setWalletAddress(address);

      // Check if we're on Hedera 
      if (Number(chainId) !== 296) {
        setShowAlert({
          status: true,
          type: 'info',
          message: 'Please switch to Hedera network',
        });
        await SwitchNetwork();
        return;
      }

      // Initialize contract
      const newContract = new ethers.Contract(ADDRESS, ABI, signer);
      setContract(newContract);
      console.log('Contract initialized:', newContract);
      setIsWalletConnected(true);

      // Set up event listeners
      createEventListeners({
        navigate: router.push,
        contract: newContract,
        provider: newProvider,
        walletAddress: address,
        setShowAlert,
        setUpdateGameData,
      });

      setShowAlert({
        status: true,
        type: 'success',
        message: 'Wallet connected successfully!',
      });

    } catch (error) {
      console.error('Error connecting wallet:', error);
      setShowAlert({
        status: true,
        type: 'error',
        message: 'Error connecting wallet. Please try again.',
      });
    }
  };

  // Check if wallet was previously connected
  useEffect(() => {
    const checkWalletConnection = async () => {
      const params = await GetParams();
      if (params.account !== '0x0') {
        await connectWallet();
      }
    };

    checkWalletConnection();
  }, []);

  // Handle wallet events
  useEffect(() => {
    if (isEthereum()) {
      window.ethereum.on('chainChanged', () => window.location.reload());
      window.ethereum.on('accountsChanged', () => window.location.reload());
    }

    return () => {
      if (isEthereum()) {
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  // Fetch game rooms only when wallet is connected
  useEffect(() => {
    const fetchGameRooms = async () => {
      if (!contract || !isWalletConnected) return;
      
      try {
        console.log('Fetching active rooms...');
        const minp = await contract.MIN_PLAYERS;
        console.log('Minimum players:', minp);
        const activeRooms = await contract.getActiveGameRooms();
        console.log('Active rooms response type:', typeof activeRooms);
        console.log('Active rooms array:', Array.from(activeRooms ?? []));
        
        if (!activeRooms || !activeRooms.length) {
          console.log('No active rooms found');
          setGameRooms([]);
          return;
        }

        const roomDetails = await Promise.all(
          Array.from(activeRooms).map(async (roomId: any) => {
            try {
              return await contract.getGameRoomDetails(roomId);
            } catch (error) {
              console.error(`Error fetching room ${roomId}:`, error);
              return null;
            }
          })
        );

        const validRooms = roomDetails.filter(room => room !== null);
        setGameRooms(validRooms);
        
      } catch (error) {
        console.error('Error in fetchGameRooms:', error);
        setGameRooms([]);
      }
    };

    fetchGameRooms();
  }, [contract, isWalletConnected, updateGameData]);

  // Game actions - only available when wallet is connected
  const createRoom = async () => {
    if (!contract || !isWalletConnected) {
      setShowAlert({
        status: true,
        type: 'error',
        message: 'Please connect your wallet first!',
      });
      return;
    }

    try {
      const tx = await contract.createGameRoom();
      await tx.wait();
      setUpdateGameData(prev => prev + 1);
    } catch (error) {
      console.error('Error creating room:', error);
      setShowAlert({
        status: true,
        type: 'error',
        message: 'Error creating room. Please try again.',
      });
    }
  };

  const joinRoom = async (roomId: number) => {
    if (!contract || !isWalletConnected) return;
    try {
      const tx = await contract.joinGameRoom(roomId);
      await tx.wait();
      setUpdateGameData(prev => prev + 1);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const placeBid = async (roomId: number, digit: number, quantity: number) => {
    if (!contract || !isWalletConnected) return;
    
    try {
      // Check if it's the player's turn
      const roomDetails = await contract.getGameRoomDetails(roomId);
      if (roomDetails.currentTurn.toLowerCase() !== walletAddress.toLowerCase()) {
        setShowAlert({
          status: true,
          type: 'error',
          message: "It's not your turn!",
        });
        return;
      }

      const tx = await contract.placeBid(roomId, digit, quantity);
      await tx.wait();
      
      // Update game state after bid
      setUpdateGameData(prev => prev + 1);
      await handleTurnChange(roomId);
      
    } catch (error) {
      console.error('Error placing bid:', error);
      setShowAlert({
        status: true,
        type: 'error',
        message: 'Error placing bid. Please try again.',
      });
    }
  };

  const callLiar = async (roomId: number) => {
    if (!contract || !isWalletConnected) return;
    try {
      const tx = await contract.callLiar(roomId);
      await tx.wait();
      setUpdateGameData(prev => prev + 1);
    } catch (error) {
      console.error('Error calling liar:', error);
    }
  };

  // Reset web3 onboarding modal params
  useEffect(() => {
    const resetParams = async () => {
      const currentStep = await GetParams();
      setStep(currentStep.step);
    };

    resetParams();

    if (isEthereum()) {
      window.ethereum.on('chainChanged', resetParams);
      window.ethereum.on('accountsChanged', resetParams);
    }

    return () => {
      if (isEthereum()) {
        window.ethereum.removeListener('chainChanged', resetParams);
        window.ethereum.removeListener('accountsChanged', resetParams);
      }
    };
  }, []);

  // Update wallet address
  const updateCurrentWalletAddress = async () => {
    if (isEthereum()) {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      if (accounts && accounts[0]) {
        setWalletAddress(accounts[0]);
        setIsWalletConnected(true);
      }
    }
  };

  useEffect(() => {
    if (isEthereum()) {
      updateCurrentWalletAddress();
      window.ethereum.on('accountsChanged', updateCurrentWalletAddress);
    }

    return () => {
      if (isEthereum()) {
        window.ethereum.removeListener('accountsChanged', updateCurrentWalletAddress);
      }
    };
  }, []);

  const disconnectWallet = async () => {
    try {
      setWalletAddress('');
      setIsWalletConnected(false);
      setContract(null);
      setProvider(null);
      
      setShowAlert({
        status: true,
        type: 'success',
        message: 'Wallet disconnected successfully!',
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setShowAlert({
        status: true,
        type: 'error',
        message: 'Error disconnecting wallet. Please try again.',
      });
    }
  };

  const handleTurnChange = async (roomId: number) => {
    if (!contract || !isWalletConnected) return;
    
    try {
      const roomDetails = await contract.getGameRoomDetails(roomId);
      const currentTurnAddress = roomDetails.currentTurn;
      setCurrentTurn(currentTurnAddress);
      
      // Notify if it's the current player's turn
      if (currentTurnAddress.toLowerCase() === walletAddress.toLowerCase()) {
        setShowAlert({
          status: true,
          type: 'info',
          message: "It's your turn!",
        });
      }
    } catch (error) {
      console.error('Error handling turn change:', error);
    }
  };

  // Add event listener for turn changes
  useEffect(() => {
    if (contract) {
      contract.on("TurnChanged", (roomId: number, newTurn: string) => {
        handleTurnChange(roomId);
      });

      return () => {
        contract.off("TurnChanged");
      };
    }
  }, [contract]);

  return (
    <GlobalContext.Provider
      value={{
        walletAddress,
        contract,
        gameRooms,
        currentRoom,
        showAlert,
        isWalletConnected,
        connectWallet,
        createRoom,
        joinRoom,
        placeBid,
        callLiar,
        setShowAlert,
        updateCurrentWalletAddress,
        disconnectWallet,
        currentTurn,
        gameStatus,
        handleTurnChange,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext); 
import { ethers } from 'ethers';
import { ABI } from '../contract/index';
import { GameState } from '../types/index';

interface EventListenerProps {
  navigate: (path: string) => void;
  contract: ethers.Contract;
  provider: ethers.BrowserProvider;
  walletAddress: string;
  setShowAlert: (alert: { status: boolean; type: string; message: string }) => void;
  setUpdateGameData: (cb: (prev: number) => number) => void;
}

const AddNewEvent = (
  eventName: string,
  provider: ethers.BrowserProvider,
  contract: ethers.Contract,
  cb: (parsedLog: any) => void
) => {
  const handler = (log: any) => {
    const iface = new ethers.Interface(ABI);
    const parsedLog = iface.parseLog({
      topics: log.topics,
      data: log.data
    });
    cb(parsedLog);
  };

  contract.on(eventName, handler);
  return () => contract.off(eventName, handler);
};

export const createEventListeners = ({
  navigate,
  contract,
  provider,
  walletAddress,
  setShowAlert,
  setUpdateGameData,
}: EventListenerProps) => {
  // Player Registration Event
  const PlayerRegisteredFilter: any = contract.filters.PlayerRegistered();
  AddNewEvent(PlayerRegisteredFilter, provider, contract, ({ args }) => {
    console.log('New player registered!', args);

    if (walletAddress.toLowerCase() === args.player.toLowerCase()) {
      setShowAlert({
        status: true,
        type: 'success',
        message: 'Successfully registered for Liar\'s Poker!',
      });
    }
  });

  // Room Creation Event
  const RoomCreatedFilter: any = contract.filters.RoomCreated();
  AddNewEvent(RoomCreatedFilter, provider, contract, ({ args }) => {
    console.log('New room created!', args);

    if (walletAddress.toLowerCase() === args.creator.toLowerCase()) {
      setShowAlert({
        status: true,
        type: 'success',
        message: `Room ${args.roomId} created successfully!`,
      });
      navigate(`/room/${args.roomId}`);
    }
  });

  // Player Joined Event
  const PlayerJoinedFilter: any = contract.filters.PlayerJoined();
  AddNewEvent(PlayerJoinedFilter, provider, contract, ({ args }) => {
    console.log('Player joined room!', args);
    setUpdateGameData((prev) => prev + 1);
  });

  // Game Started Event
  const GameStartedFilter: any = contract.filters.GameStarted();
  AddNewEvent(GameStartedFilter, provider, contract, ({ args }) => {
    console.log('Game started!', args);
    setUpdateGameData((prev) => prev + 1);
  });

  // Bid Placed Event
  const BidPlacedFilter: any = contract.filters.BidPlaced();
  AddNewEvent(BidPlacedFilter, provider, contract, ({ args }) => {
    console.log('New bid placed!', args);
    setUpdateGameData((prev) => prev + 1);
  });

  // Liar Called Event
  const LiarCalledFilter: any = contract.filters.LiarCalled();
  AddNewEvent(LiarCalledFilter, provider, contract, ({ args }) => {
    console.log('Liar called!', args);
    setUpdateGameData((prev) => prev + 1);
  });

  // Game Ended Event
  const GameEndedFilter: any = contract.filters.GameEnded();
  AddNewEvent(GameEndedFilter, provider, contract, ({ args }) => {
    console.log('Game ended!', args);

    if (walletAddress.toLowerCase() === args.winner.toLowerCase()) {
      setShowAlert({
        status: true,
        type: 'success',
        message: `Congratulations! You won ${ethers.formatEther(args.prizePool)} ETH!`,
      });
    }

    setUpdateGameData((prev) => prev + 1);
    navigate('/rooms');
  });
}; 
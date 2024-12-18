export enum GameState {
  CREATED,
  WAITING,
  READY,
  IN_PROGRESS,
  REVEALING,
  CHALLENGE_PHASE,
  COMPLETED,
  CANCELED
}

export interface Player {
  walletAddress: string;
  serialNumber: number;
  registrationTimestamp: number;
  performanceScore: number;
  isRegistered: boolean;
}

export interface Bid {
  bidder: string;
  digit: number;
  quantity: number;
  bidAmount: string;
  bidTimestamp: number;
}

export interface GameRoom {
  roomId: number;
  creator: string;
  currentState: GameState;
  creationTimestamp: number;
  activePlayers: string[];
  currentBid: Bid;
  currentTurn: string;
  lastBidder: string;
  winner: string;
  totalPrizePool: string;
  exists: boolean;
} 
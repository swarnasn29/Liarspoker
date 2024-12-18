// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LiarsPokerMasterContract
 * @dev Decentralized blockchain-based Liar's Poker game with advanced mechanics
 * @notice Secure, transparent, and decentralized multiplayer Liar's Poker game
 * @author
 */
contract LiarsPokerMasterContract {
    // Constants for game configuration
    uint256 public constant MIN_PLAYERS = 2;
    uint256 public constant MAX_PLAYERS = 6;
    uint256 public constant MIN_BID_AMOUNT = 1; // 0.0001 HBAR
    uint256 public constant ROOM_CHARGE = 1; // 0.0001 HBAR

    // Owner address
    address public owner;
    // Game state enumerations
    enum GameState {
        CREATED,
        WAITING,
        READY,
        IN_PROGRESS,
        REVEALING,
        CHALLENGE_PHASE,
        COMPLETED,
        CANCELED
    }

    // Player structure
    struct Player {
        address payable walletAddress;
        uint256 serialNumber;
        uint256 registrationTimestamp;
        uint256 performanceScore;
        bool isRegistered;
    }

    // Mapping to track registered players
    mapping(address => Player) public registeredPlayers;

    // Game-specific player structure
    struct RoomPlayer {
        uint256 serialNumber;
        uint256 joinedTimestamp;
        uint256 totalBetAmount;
        bool hasJoined;
        bool hasRevealed;
        bool isActive;
    }
    // Bid structure
    struct Bid {
        address bidder;
        uint8 digit;
        uint8 quantity;
        uint256 bidAmount;
        uint256 bidTimestamp;
    }

    // Game room structure
    struct GameRoom {
        uint256 roomId;
        address creator;
        GameState currentState;
        uint256 creationTimestamp;
        uint256 minBid; // Minimum bid amount for this room
        uint256 numberOfPlayers; // Required number of players to start
        address[] activePlayers;
        mapping(address => RoomPlayer) players;
        Bid currentBid;
        address currentTurn;
        address lastBidder;
        address winner;
        uint256 totalPrizePool;
        bool exists;
    }

    // Storage variables
    uint256 private nextRoomId = 1;
    uint256 private nextSerialNumber = 1;
    mapping(uint256 => GameRoom) public gameRooms;
    mapping(address => uint256) public playerCurrentRoom;

    uint256 public accumulatedRoomCharges;

    // Events
    event PlayerRegistered(
        address indexed player,
        uint256 serialNumber,
        uint256 timestamp
    );
    // Event emitted when a room is created
    event RoomCreated(
        uint256 indexed roomId,
        address indexed creator,
        uint256 timestamp,
        uint256 minBid,
        uint256 numberOfPlayers
    );

    event PlayerJoined(
        uint256 indexed roomId,
        address indexed player,
        uint256 serialNumber
    );
    event GameStarted(
        uint256 indexed roomId,
        address[] players,
        uint256 startTimestamp
    );

    event BidPlaced(
        uint256 indexed roomId,
        address indexed bidder,
        uint8 digit,
        uint8 quantity,
        uint256 bidAmount
    );
    event LiarCalled(
        uint256 indexed roomId,
        address indexed caller,
        address indexed lastBidder
    );
    event GameEnded(
        uint256 indexed roomId,
        address indexed winner,
        uint256 prizePool
    );
    event TurnChanged(uint256 roomId, address newTurn);
    event RoomChargeWithdrawn(address indexed owner, uint256 amount);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyRegisteredPlayer() {
        require(
            registeredPlayers[msg.sender].isRegistered,
            "Player not registered"
        );
        _;
    }

    modifier roomExists(uint256 _roomId) {
        require(gameRooms[_roomId].exists, "Room does not exist");
        _;
    }

    modifier onlyRoomPlayer(uint256 _roomId) {
        require(
            gameRooms[_roomId].players[msg.sender].hasJoined,
            "Not a room participant"
        );
        _;
    }

    modifier correctGameState(uint256 _roomId, GameState _requiredState) {
        require(
            gameRooms[_roomId].currentState == _requiredState,
            "Invalid game state for this action"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Functions
    /**
     * @notice Register a player globally with an automatically assigned serial number
     */
    function registerPlayer() external {
        require(
            !registeredPlayers[msg.sender].isRegistered,
            "Player already registered"
        );

        uint256 assignedSerialNumber = nextSerialNumber++;

        registeredPlayers[msg.sender] = Player({
            walletAddress: payable(msg.sender),
            serialNumber: assignedSerialNumber,
            registrationTimestamp: block.timestamp,
            performanceScore: 0,
            isRegistered: true
        });

        emit PlayerRegistered(
            msg.sender,
            assignedSerialNumber,
            block.timestamp
        );
    }

    /**
     * @notice Check if a player is registered
     * @param _player The address of the player to check
     * @return isRegistered True if the player is registered, false otherwise
     */
    function isPlayerRegistered(address _player)
        external
        view
        returns (bool isRegistered)
    {
        return registeredPlayers[_player].isRegistered;
    }

    /**
     * @notice Create a new game room with custom parameters
     * @param _minBid The minimum bid amount for the game room
     * @param _numberOfPlayers The number of players required to start the game
     * @return roomId The unique identifier of the created game room
     */
    function createGameRoom(uint256 _minBid, uint256 _numberOfPlayers)
        external
        returns (uint256 roomId)
    {
        require(_minBid >= MIN_BID_AMOUNT, "Minimum bid is too low");
        require(
            _numberOfPlayers >= MIN_PLAYERS && _numberOfPlayers <= MAX_PLAYERS,
            "Invalid number of players"
        );
        roomId = nextRoomId++;
        GameRoom storage room = gameRooms[roomId];
        room.roomId = roomId;
        room.creator = msg.sender;
        room.currentState = GameState.CREATED;
        room.minBid = _minBid;
        room.numberOfPlayers = _numberOfPlayers;
        room.creationTimestamp = block.timestamp;
        room.exists = true;

        emit RoomCreated(
            roomId,
            msg.sender,
            block.timestamp,
            _minBid,
            _numberOfPlayers
        );
    }

    /**
     * @notice Join an existing game room
     * @param _roomId The ID of the room to join
     */
    function joinGameRoom(uint256 _roomId)
        external
        payable
        roomExists(_roomId)
        onlyRegisteredPlayer
    {
        require(msg.value >= ROOM_CHARGE, "Incorrect room charge");

        GameRoom storage room = gameRooms[_roomId];
        require(
            room.currentState == GameState.CREATED ||
                room.currentState == GameState.WAITING,
            "Room not open for joining"
        );
        require(room.activePlayers.length < MAX_PLAYERS, "Room is full");
        require(!room.players[msg.sender].hasJoined, "Player already joined");

        Player storage globalPlayer = registeredPlayers[msg.sender];
        room.players[msg.sender] = RoomPlayer({
            serialNumber: globalPlayer.serialNumber,
            joinedTimestamp: block.timestamp,
            totalBetAmount: 0,
            hasJoined: true,
            hasRevealed: false,
            isActive: true
        });
        room.activePlayers.push(msg.sender);

        accumulatedRoomCharges += msg.value;

        if (room.activePlayers.length >= MIN_PLAYERS) {
            room.currentState = GameState.WAITING;
        }

        emit PlayerJoined(_roomId, msg.sender, globalPlayer.serialNumber);
    }

    /**
     * @notice Start the game and assign serial numbers to players
     * @param _roomId The ID of the room to start
     * @param _serialNumbers An array of serial numbers to assign to the players
     */
    function startGame(uint256 _roomId, uint256[] calldata _serialNumbers)
        external
        roomExists(_roomId)
        correctGameState(_roomId, GameState.WAITING)
    {
        GameRoom storage room = gameRooms[_roomId];

        // Ensure the number of serial numbers matches the number of players
        require(
            _serialNumbers.length == room.activePlayers.length,
            "Mismatch between players and serial numbers"
        );

        require(
            room.activePlayers.length >= room.numberOfPlayers,
            "Not enough players"
        );

        // Assign serial numbers to players
        for (uint256 i = 0; i < room.activePlayers.length; i++) {
            address player = room.activePlayers[i];
            room.players[player].serialNumber = _serialNumbers[i];
        }

        // Update the game state to IN_PROGRESS
        room.currentState = GameState.IN_PROGRESS;
        room.currentTurn = room.activePlayers[0]; // Set the first player's turn

        emit GameStarted(_roomId, room.activePlayers, block.timestamp);
    }

    /**
     * @notice Place a bid during the game
     * @param _roomId The ID of the room
     * @param _digit The digit being bid on
     * @param _quantity The quantity of the digit being bid
     */
    function placeBid(
        uint256 _roomId,
        uint8 _digit,
        uint8 _quantity
    )
        external
        payable
        roomExists(_roomId)
        onlyRoomPlayer(_roomId)
        correctGameState(_roomId, GameState.IN_PROGRESS)
    {
        require(_digit <= 9, "Invalid digit");
        require(_quantity > 0, "Invalid quantity");
        require(msg.value >= MIN_BID_AMOUNT, "Bid amount too low");

        GameRoom storage room = gameRooms[_roomId];
        require(msg.sender == room.currentTurn, "Not your turn");

        if (room.currentBid.bidder != address(0)) {
            require(
                msg.value > room.currentBid.bidAmount,
                "New bid must be higher"
            );
        }

        room.currentBid = Bid({
            bidder: msg.sender,
            digit: _digit,
            quantity: _quantity,
            bidAmount: msg.value,
            bidTimestamp: block.timestamp
        });
        room.lastBidder = msg.sender;
        room.players[msg.sender].totalBetAmount += msg.value;
        room.totalPrizePool += msg.value;

        updateTurn(_roomId);

        emit BidPlaced(_roomId, msg.sender, _digit, _quantity, msg.value);
    }

    /**
     * @notice Withdraw accumulated room charges (onlyOwner)
     */
    function withdrawRoomCharges() external onlyOwner {
        uint256 amount = accumulatedRoomCharges;
        accumulatedRoomCharges = 0;
        payable(owner).transfer(amount);

        emit RoomChargeWithdrawn(owner, amount);
    }

    /**
     * @notice Call liar on the previous bid
     * @param _roomId The ID of the room
     */
    function callLiar(uint256 _roomId)
        external
        roomExists(_roomId)
        onlyRoomPlayer(_roomId)
        correctGameState(_roomId, GameState.IN_PROGRESS)
    {
        GameRoom storage room = gameRooms[_roomId];
        require(msg.sender == room.currentTurn, "Not your turn");
        require(room.lastBidder != address(0), "No bid to challenge");

        room.currentState = GameState.REVEALING;

        emit LiarCalled(_roomId, msg.sender, room.lastBidder);
    }

    /**
     * @notice Reveal a player's number
     * @param _roomId The ID of the room
     */
    function revealNumber(uint256 _roomId)
        external
        roomExists(_roomId)
        onlyRoomPlayer(_roomId)
        correctGameState(_roomId, GameState.REVEALING)
    {
        GameRoom storage room = gameRooms[_roomId];
        RoomPlayer storage player = room.players[msg.sender];
        require(!player.hasRevealed, "Already revealed");

        player.hasRevealed = true;

        if (allPlayersRevealed(_roomId)) {
            determineWinner(_roomId);
        }
    }

    /**
     * @notice Internal function to determine the winner
     * @param _roomId The ID of the room
     */
    function determineWinner(uint256 _roomId) internal {
        GameRoom storage room = gameRooms[_roomId];
        uint8 totalCount = countOccurrences(room);

        if (totalCount >= room.currentBid.quantity) {
            room.winner = room.lastBidder;
        } else {
            room.winner = room.currentTurn;
        }

        payable(room.winner).transfer(room.totalPrizePool);
        room.currentState = GameState.COMPLETED;

        emit GameEnded(_roomId, room.winner, room.totalPrizePool);
    }

    /**
     * @notice Count occurrences of the current bid digit
     * @param room The game room
     * @return totalCount The total count of the bid digit
     */
    function countOccurrences(GameRoom storage room)
        internal
        view
        returns (uint8 totalCount)
    {
        for (uint256 i = 0; i < room.activePlayers.length; i++) {
            address playerAddr = room.activePlayers[i];
            uint256 serial = room.players[playerAddr].serialNumber;

            while (serial > 0) {
                if (uint8(serial % 10) == room.currentBid.digit) {
                    totalCount++;
                }
                serial /= 10;
            }
        }
    }

    /**
     * @notice Check if all players have revealed their numbers
     * @param _roomId The ID of the room
     * @return Whether all players have revealed
     */
    function allPlayersRevealed(uint256 _roomId) internal view returns (bool) {
        GameRoom storage room = gameRooms[_roomId];
        for (uint256 i = 0; i < room.activePlayers.length; i++) {
            if (!room.players[room.activePlayers[i]].hasRevealed) {
                return false;
            }
        }
        return true;
    }

    // Helper functions for turn updates, winner determination, etc., remain unchanged
    function updateTurn(uint256 _roomId) internal {
        GameRoom storage room = gameRooms[_roomId];
        uint256 currentIndex;
        for (uint256 i = 0; i < room.activePlayers.length; i++) {
            if (room.activePlayers[i] == room.currentTurn) {
                currentIndex = i;
                break;
            }
        }
        address NewTurn = room.activePlayers[
            (currentIndex + 1) % room.activePlayers.length
        ];
        room.currentTurn = NewTurn;
        emit TurnChanged(_roomId, NewTurn);
    }

    function getCurrentBid(uint256 _roomId)
        external
        view
        returns (
            address,
            uint8,
            uint8
        )
    {
        Bid memory bid = gameRooms[_roomId].currentBid;
        return (bid.bidder, bid.digit, bid.quantity);
    }

    function getCurrentTurn(uint256 _roomId) external view returns (address) {
        return gameRooms[_roomId].currentTurn;
    }

    /**
     * @notice Retrieve comprehensive game room details
     * @param _roomId Room to query
     */
    function getGameRoomDetails(uint256 _roomId)
        external
        view
        roomExists(_roomId)
        returns (
            address creator,
            GameState state,
            uint256 prizePool,
            address[] memory players,
            address currentTurn
        )
    {
        GameRoom storage room = gameRooms[_roomId];
        return (
            room.creator,
            room.currentState,
            room.totalPrizePool,
            room.activePlayers,
            room.currentTurn
        );
    }

    /**
     * @notice Get player details within a specific game room
     * @param _roomId Room to query
     * @param _player Player address
     *  Comprehensive player information in the format of LiarsPokerMasterContract.Player memory.
     */
    function getPlayerDetails(uint256 _roomId, address _player)
        external
        view
        roomExists(_roomId)
        returns (
            address walletAddress,
            uint256 serialNumber,
            uint256 registrationTimestamp,
            uint256 performanceScore,
            bool isRegistered
        )
    {
        return (
            registeredPlayers[_player].walletAddress,
            registeredPlayers[_player].serialNumber,
            registeredPlayers[_player].registrationTimestamp,
            registeredPlayers[_player].performanceScore,
            registeredPlayers[_player].isRegistered
        );
    }

    // Additional functions for game mechanics (bid placement, reveal, winner determination)
    // would be implemented here with similar comprehensive documentation

    /**
     * @notice Retrieve all active game rooms
     * @return Array of active room IDs
     */
    function getActiveGameRooms() external view returns (uint256[] memory) {
        uint256[] memory activeRooms = new uint256[](nextRoomId - 1);
        uint256 count = 0;

        for (uint256 i = 1; i < nextRoomId; i++) {
            GameState state = gameRooms[i].currentState;
            if (
                gameRooms[i].exists &&
                (state == GameState.CREATED ||
                    state == GameState.WAITING ||
                    state == GameState.READY)
            ) {
                activeRooms[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeRooms[i];
        }

        return result;
    }

    /**
     * @notice Retrieve all active game rooms in the WAITING state
     * @return Array of active room IDs in the WAITING state
     */
    function getWaitingRooms() external view returns (uint256[] memory) {
        uint256[] memory waitingRooms = new uint256[](nextRoomId - 1);
        uint256 count = 0;

        for (uint256 i = 1; i < nextRoomId; i++) {
            GameState state = gameRooms[i].currentState;
            if (gameRooms[i].exists && state == GameState.WAITING) {
                waitingRooms[count] = i;
                count++;
            }
        }

        // Resize the array to match the actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = waitingRooms[i];
        }

        return result;
    }
}

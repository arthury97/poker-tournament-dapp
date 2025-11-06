// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PokerTournamentToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TournamentManager
 * @dev Factory contract to create and manage poker player tokens
 * @notice Players create tokens to sell shares of their potential tournament winnings
 */
contract TournamentManager is Ownable, ReentrancyGuard {
    
    // Array to store all created player tokens
    address[] public playerTokens;
    
    // Mapping to track player token creators
    mapping(address => address[]) public playerTokenCreators;
    
    // Mapping to track active player tokens
    mapping(address => bool) public isActivePlayerToken;
    
    // Events
    event PlayerTokenCreated(
        address indexed playerTokenAddress,
        address indexed player,
        string playerName,
        uint256 buyInAmount,
        uint256 totalTokens,
        uint256 profitSharePercentage
    );
    
    // Alias event for frontend compatibility
    event TournamentCreated(
        address indexed tournamentAddress,
        address indexed creator,
        string name,
        uint256 buyInAmount,
        uint256 totalTokens,
        uint256 profitSharePercentage
    );
    
    event PlayerTokenDeactivated(address indexed playerTokenAddress);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new poker player token
     */
    function createPlayerToken(
        string memory _playerName,
        string memory _symbol,
        uint256 _buyInAmount,
        uint256 _totalTokens,
        uint256 _profitSharePercentage
    ) external returns (address) {
        require(_totalTokens > 0, "Total tokens must be greater than 0");
        require(_profitSharePercentage <= 100, "Profit share cannot exceed 100%");
        require(_buyInAmount > 0, "Buy-in amount must be greater than 0");
        require(bytes(_playerName).length > 0, "Player name cannot be empty");
        require(bytes(_symbol).length > 0, "Token symbol cannot be empty");

        // Create new player token
        PokerTournamentToken newPlayerToken = new PokerTournamentToken(
            _playerName,
            _symbol,
            _buyInAmount,
            _totalTokens,
            _profitSharePercentage
        );

        // Transfer ownership to the player
        newPlayerToken.transferOwnership(msg.sender);

        address playerTokenAddress = address(newPlayerToken);
        
        // Add to player tokens array
        playerTokens.push(playerTokenAddress);
        
        // Track player's tokens
        playerTokenCreators[msg.sender].push(playerTokenAddress);
        
        // Mark as active
        isActivePlayerToken[playerTokenAddress] = true;

        emit PlayerTokenCreated(
            playerTokenAddress,
            msg.sender,
            _playerName,
            _buyInAmount,
            _totalTokens,
            _profitSharePercentage
        );
        
        // Also emit TournamentCreated for frontend compatibility
        emit TournamentCreated(
            playerTokenAddress,
            msg.sender,
            _playerName,
            _buyInAmount,
            _totalTokens,
            _profitSharePercentage
        );

        return playerTokenAddress;
    }

    /**
     * @dev Alias for createPlayerToken - creates a tournament token
     * @notice This is an alias function for frontend compatibility
     */
    function createTournament(
        string memory _name,
        string memory _symbol,
        uint256 _buyInAmount,
        uint256 _totalTokens,
        uint256 _profitSharePercentage
    ) external returns (address) {
        require(_totalTokens > 0, "Total tokens must be greater than 0");
        require(_profitSharePercentage <= 100, "Profit share cannot exceed 100%");
        require(_buyInAmount > 0, "Buy-in amount must be greater than 0");
        require(bytes(_name).length > 0, "Player name cannot be empty");
        require(bytes(_symbol).length > 0, "Token symbol cannot be empty");

        PokerTournamentToken newPlayerToken = new PokerTournamentToken(
            _name,
            _symbol,
            _buyInAmount,
            _totalTokens,
            _profitSharePercentage
        );

        newPlayerToken.transferOwnership(msg.sender);

        address playerTokenAddress = address(newPlayerToken);
        playerTokens.push(playerTokenAddress);
        playerTokenCreators[msg.sender].push(playerTokenAddress);
        isActivePlayerToken[playerTokenAddress] = true;

        emit PlayerTokenCreated(
            playerTokenAddress,
            msg.sender,
            _name,
            _buyInAmount,
            _totalTokens,
            _profitSharePercentage
        );
        
        emit TournamentCreated(
            playerTokenAddress,
            msg.sender,
            _name,
            _buyInAmount,
            _totalTokens,
            _profitSharePercentage
        );

        return playerTokenAddress;
    }

    /**
     * @dev Get all player tokens created by a specific address
     */
    function getPlayerTokens(address player) external view returns (address[] memory) {
        return playerTokenCreators[player];
    }

    /**
     * @dev Alias for getPlayerTokens - getCreatorTournaments for frontend compatibility
     */
    function getCreatorTournaments(address creator) external view returns (address[] memory) {
        return playerTokenCreators[creator];
    }

    /**
     * @dev Get total number of player tokens
     */
    function getTotalPlayerTokens() external view returns (uint256) {
        return playerTokens.length;
    }

    /**
     * @dev Alias for getTotalPlayerTokens - getTotalTournaments for frontend compatibility
     */
    function getTotalTournaments() external view returns (uint256) {
        return playerTokens.length;
    }

    /**
     * @dev Get player token at specific index
     */
    function getPlayerToken(uint256 index) external view returns (address) {
        require(index < playerTokens.length, "Index out of bounds");
        return playerTokens[index];
    }

    /**
     * @dev Alias for playerTokens array - tournaments array for frontend compatibility
     */
    function tournaments(uint256 index) external view returns (address) {
        require(index < playerTokens.length, "Index out of bounds");
        return playerTokens[index];
    }

    /**
     * @dev Get all active player tokens
     */
    function getActivePlayerTokens() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // Count active player tokens
        for (uint256 i = 0; i < playerTokens.length; i++) {
            if (isActivePlayerToken[playerTokens[i]]) {
                activeCount++;
            }
        }
        
        // Create array with active player tokens
        address[] memory activePlayerTokens = new address[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < playerTokens.length; i++) {
            if (isActivePlayerToken[playerTokens[i]]) {
                activePlayerTokens[currentIndex] = playerTokens[i];
                currentIndex++;
            }
        }
        
        return activePlayerTokens;
    }

    /**
     * @dev Alias for getActivePlayerTokens - getActiveTournaments for frontend compatibility
     */
    function getActiveTournaments() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < playerTokens.length; i++) {
            if (isActivePlayerToken[playerTokens[i]]) {
                activeCount++;
            }
        }
        
        address[] memory activePlayerTokens = new address[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < playerTokens.length; i++) {
            if (isActivePlayerToken[playerTokens[i]]) {
                activePlayerTokens[currentIndex] = playerTokens[i];
                currentIndex++;
            }
        }
        
        return activePlayerTokens;
    }

    /**
     * @dev Deactivate a player token (only owner or player token creator)
     */
    function deactivatePlayerToken(address playerTokenAddress) external {
        require(isActivePlayerToken[playerTokenAddress], "Player token not active");
        
        PokerTournamentToken playerToken = PokerTournamentToken(payable(playerTokenAddress));
        
        // Check if caller is owner of this contract or owner of the player token
        require(
            msg.sender == owner() || msg.sender == playerToken.owner(),
            "Not authorized to deactivate this player token"
        );
        
        isActivePlayerToken[playerTokenAddress] = false;
        
        emit PlayerTokenDeactivated(playerTokenAddress);
    }

    /**
     * @dev Get player token details
     */
    function getPlayerTokenDetails(address playerTokenAddress) external view returns (
        string memory playerName,
        uint256 buyInAmount,
        uint256 totalTokens,
        uint256 tokensSold,
        uint256 profitSharePercentage,
        bool tournamentCompleted,
        uint256 playerWinnings,
        bool winningsDistributed,
        address playerOwner
    ) {
        PokerTournamentToken playerToken = PokerTournamentToken(payable(playerTokenAddress));
        
        (
            playerName,
            buyInAmount,
            totalTokens,
            tokensSold,
            profitSharePercentage,
            tournamentCompleted,
            playerWinnings,
            winningsDistributed
        ) = playerToken.getPlayerInfo();
        
        playerOwner = playerToken.owner();
    }

    /**
     * @dev Alias for getPlayerTokenDetails - getTournamentDetails for frontend compatibility
     */
    function getTournamentDetails(address tournamentAddress) external view returns (
        string memory name,
        uint256 buyInAmount,
        uint256 totalTokens,
        uint256 tokensSold,
        uint256 profitSharePercentage,
        bool tournamentCompleted,
        uint256 totalWinnings,
        bool winningsDistributed,
        address tournamentOwner
    ) {
        PokerTournamentToken playerToken = PokerTournamentToken(payable(tournamentAddress));
        
        (
            name,
            buyInAmount,
            totalTokens,
            tokensSold,
            profitSharePercentage,
            tournamentCompleted,
            totalWinnings,
            winningsDistributed
        ) = playerToken.getPlayerInfo();
        
        tournamentOwner = playerToken.owner();
    }

    /**
     * @dev Alias for isActivePlayerToken mapping - isActiveTournament for frontend compatibility
     * @notice isActivePlayerToken is a public mapping, so the getter is auto-generated
     */
    function isActiveTournament(address tournamentAddress) external view returns (bool) {
        return isActivePlayerToken[tournamentAddress];
    }

    /**
     * @dev Deactivate a tournament (alias for deactivatePlayerToken)
     */
    function deactivateTournament(address tournamentAddress) external {
        require(isActivePlayerToken[tournamentAddress], "Player token not active");
        
        PokerTournamentToken playerToken = PokerTournamentToken(payable(tournamentAddress));
        
        require(
            msg.sender == owner() || msg.sender == playerToken.owner(),
            "Not authorized to deactivate this player token"
        );
        
        isActivePlayerToken[tournamentAddress] = false;
        
        emit PlayerTokenDeactivated(tournamentAddress);
    }

    /**
     * @dev Emergency function to deactivate all player tokens (only owner)
     */
    function emergencyDeactivateAll() external onlyOwner {
        for (uint256 i = 0; i < playerTokens.length; i++) {
            isActivePlayerToken[playerTokens[i]] = false;
        }
    }
}

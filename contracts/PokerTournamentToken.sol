// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PokerTournamentToken
 * @dev ERC20 token representing shares in a poker player's tournament winnings
 * @notice The token creator is a poker tournament participant who sells shares of their potential winnings
 */
contract PokerTournamentToken is ERC20, Ownable, ReentrancyGuard {

    // Player's tournament participation details
    struct PlayerTournamentInfo {
        string playerName;
        uint256 buyInAmount;
        uint256 totalTokens;
        uint256 tokensSold;
        uint256 profitSharePercentage; // Percentage of player's winnings to share (0-100)
        bool tournamentCompleted;
        uint256 playerWinnings;
        bool winningsDistributed;
    }

    PlayerTournamentInfo public playerInfo;
    
    // Mapping to track if user has claimed their share
    mapping(address => bool) public hasClaimedWinnings;
    
    // Track buyers and their purchase amounts for refunds
    address[] public buyers;
    mapping(address => uint256) public buyerPurchaseAmount; // ETH paid by each buyer
    mapping(address => bool) public isBuyer;
    
    // Trading system
    struct Order {
        address trader;
        uint256 tokenAmount;
        uint256 pricePerToken; // in wei
        bool isBuyOrder;
        bool isActive;
        uint256 timestamp;
    }
    
    mapping(uint256 => Order) public orders;
    uint256 public nextOrderId;
    uint256 public totalOrders;
    
    // Events
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethAmount);
    event PlayerTournamentCompleted(uint256 playerWinnings);
    event WinningsDistributed(address indexed recipient, uint256 amount);
    event ProfitShareUpdated(uint256 newPercentage);
    event OrderCreated(uint256 indexed orderId, address indexed trader, uint256 tokenAmount, uint256 pricePerToken, bool isBuyOrder);
    event OrderExecuted(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 tokenAmount, uint256 totalPrice);
    event OrderCancelled(uint256 indexed orderId);
    event TokenDeleted(address indexed tokenAddress, uint256 totalRefunded, uint256 buyersRefunded);
    event BuyerRefunded(address indexed buyer, uint256 amount);

    constructor(
        string memory _playerName,
        string memory _tokenSymbol,
        uint256 _buyInAmount,
        uint256 _totalTokens,
        uint256 _profitSharePercentage
    ) ERC20(_playerName, _tokenSymbol) Ownable(msg.sender) {
        require(_totalTokens > 0, "Total tokens must be greater than 0");
        require(_profitSharePercentage <= 100, "Profit share cannot exceed 100%");
        require(_buyInAmount > 0, "Buy-in amount must be greater than 0");

        playerInfo = PlayerTournamentInfo({
            playerName: _playerName,
            buyInAmount: _buyInAmount,
            totalTokens: _totalTokens,
            tokensSold: 0,
            profitSharePercentage: _profitSharePercentage,
            tournamentCompleted: false,
            playerWinnings: 0,
            winningsDistributed: false
        });

        // Mint all tokens to the contract
        _mint(address(this), _totalTokens);
    }

    /**
     * @dev Purchase tokens representing shares in player's potential winnings
     * @notice Maximum purchase: 10,000 tokens per transaction to prevent griefing
     */
    function purchaseTokens() external payable nonReentrant {
        require(!playerInfo.tournamentCompleted, "Tournament already completed");
        require(playerInfo.tokensSold < playerInfo.totalTokens, "All tokens sold");
        require(msg.value > 0, "Must send ETH to purchase tokens");
        require(msg.sender != owner(), "Token creator cannot purchase their own tokens");

        // Calculate how many tokens can be bought with the sent ETH
        uint256 tokensToBuy = (msg.value * playerInfo.totalTokens) / playerInfo.buyInAmount;
        
        // Ensure we don't sell more tokens than available
        uint256 availableTokens = playerInfo.totalTokens - playerInfo.tokensSold;
        if (tokensToBuy > availableTokens) {
            tokensToBuy = availableTokens;
        }

        // Maximum tokens per transaction to prevent griefing
        uint256 maxTokensPerPurchase = 10_000;
        if (tokensToBuy > maxTokensPerPurchase) {
            tokensToBuy = maxTokensPerPurchase;
        }

        // Calculate actual ETH cost for the tokens
        uint256 actualEthCost = (tokensToBuy * playerInfo.buyInAmount) / playerInfo.totalTokens;
        
        // Refund excess ETH
        if (msg.value > actualEthCost) {
            payable(msg.sender).transfer(msg.value - actualEthCost);
        }

        // Track buyer for potential refunds
        if (!isBuyer[msg.sender]) {
            buyers.push(msg.sender);
            isBuyer[msg.sender] = true;
        }
        buyerPurchaseAmount[msg.sender] += actualEthCost;

        // Transfer tokens to buyer (state change after external call check)
        _transfer(address(this), msg.sender, tokensToBuy);
        playerInfo.tokensSold += tokensToBuy;

        emit TokensPurchased(msg.sender, tokensToBuy, actualEthCost);
    }

    /**
     * @dev Withdraw ETH for player's tournament buy-in (only player/owner)
     */
    function withdrawForBuyIn() external onlyOwner {
        require(!playerInfo.tournamentCompleted, "Player's tournament already completed");
        require(playerInfo.tokensSold > 0, "No tokens sold yet");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Mark player's tournament as completed and set player's winnings (only player/owner)
     * @notice Winnings must be >= 0 and <= buyInAmount * 1000 (reasonable maximum for tournament winnings)
     * @param _playerWinnings The amount of winnings from the tournament (in wei)
     */
    function completePlayerTournament(uint256 _playerWinnings) external onlyOwner {
        require(!playerInfo.tournamentCompleted, "Tournament already completed");
        require(address(this).balance >= _playerWinnings, "Insufficient contract balance");
        
        // Maximum winnings validation: reasonable cap at 1000x buy-in amount
        // This prevents unrealistic winnings from being set
        uint256 maxWinnings = playerInfo.buyInAmount * 1000;
        require(_playerWinnings <= maxWinnings, "Winnings exceed maximum allowed");
        
        // Note: uint256 cannot be negative, so no need to check >= 0
        // This allows for tournament losses (0 winnings is valid)
        
        playerInfo.tournamentCompleted = true;
        playerInfo.playerWinnings = _playerWinnings;
        
        emit PlayerTournamentCompleted(_playerWinnings);
    }

    /**
     * @dev Claim share of player's winnings based on token ownership
     */
    function claimWinnings() external nonReentrant {
        require(playerInfo.tournamentCompleted, "Player's tournament not completed yet");
        require(!hasClaimedWinnings[msg.sender], "Already claimed winnings");
        require(balanceOf(msg.sender) > 0, "No tokens to claim winnings for");

        uint256 userTokens = balanceOf(msg.sender);
        uint256 totalTokensInCirculation = playerInfo.tokensSold;
        
        // Calculate user's share of the player's winnings
        uint256 userShare = (userTokens * playerInfo.playerWinnings * playerInfo.profitSharePercentage) / 
                           (totalTokensInCirculation * 100);
        
        require(userShare > 0, "No winnings to claim");
        require(address(this).balance >= userShare, "Insufficient contract balance");

        hasClaimedWinnings[msg.sender] = true;
        payable(msg.sender).transfer(userShare);

        emit WinningsDistributed(msg.sender, userShare);
    }

    /**
     * @dev Update profit share percentage (only player/owner, before tournament completion)
     */
    function updateProfitShare(uint256 _newPercentage) external onlyOwner {
        require(!playerInfo.tournamentCompleted, "Cannot update after player's tournament completion");
        require(_newPercentage <= 100, "Profit share cannot exceed 100%");
        
        playerInfo.profitSharePercentage = _newPercentage;
        emit ProfitShareUpdated(_newPercentage);
    }

    /**
     * @dev Get user's potential share of player's winnings
     */
    function getPotentialWinnings(address user) external view returns (uint256) {
        if (!playerInfo.tournamentCompleted || hasClaimedWinnings[user]) {
            return 0;
        }

        uint256 userTokens = balanceOf(user);
        if (userTokens == 0) {
            return 0;
        }

        uint256 totalTokensInCirculation = playerInfo.tokensSold;
        return (userTokens * playerInfo.playerWinnings * playerInfo.profitSharePercentage) / 
               (totalTokensInCirculation * 100);
    }

    /**
     * @dev Get player's tournament information
     */
    function getPlayerInfo() external view returns (
        string memory playerName,
        uint256 buyInAmount,
        uint256 totalTokens,
        uint256 tokensSold,
        uint256 profitSharePercentage,
        bool tournamentCompleted,
        uint256 playerWinnings,
        bool winningsDistributed
    ) {
        PlayerTournamentInfo memory info = playerInfo;
        return (
            info.playerName,
            info.buyInAmount,
            info.totalTokens,
            info.tokensSold,
            info.profitSharePercentage,
            info.tournamentCompleted,
            info.playerWinnings,
            info.winningsDistributed
        );
    }

    /**
     * @dev Get remaining tokens available for purchase
     */
    function getRemainingTokens() external view returns (uint256) {
        return playerInfo.totalTokens - playerInfo.tokensSold;
    }

    /**
     * @dev Get current token price in ETH
     */
    function getTokenPrice() external view returns (uint256) {
        return playerInfo.buyInAmount / playerInfo.totalTokens;
    }

    /**
     * @dev Create a buy order for tokens
     * @notice Maximum order size: 10,000 tokens to prevent griefing
     */
    function createBuyOrder(uint256 _tokenAmount, uint256 _pricePerToken) external payable nonReentrant {
        require(!playerInfo.tournamentCompleted, "Tournament already completed");
        require(_tokenAmount > 0, "Token amount must be greater than 0");
        require(_tokenAmount <= 10_000, "Token amount exceeds maximum (10,000)");
        require(_pricePerToken > 0, "Price per token must be greater than 0");
        
        uint256 totalCost = _tokenAmount * _pricePerToken;
        require(msg.value >= totalCost, "Insufficient ETH sent for buy order");
        
        // Refund excess ETH
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            trader: msg.sender,
            tokenAmount: _tokenAmount,
            pricePerToken: _pricePerToken,
            isBuyOrder: true,
            isActive: true,
            timestamp: block.timestamp
        });
        
        totalOrders++;
        emit OrderCreated(orderId, msg.sender, _tokenAmount, _pricePerToken, true);
    }
    
    /**
     * @dev Create a sell order for tokens
     * @notice Maximum order size: 10,000 tokens to prevent griefing
     */
    function createSellOrder(uint256 _tokenAmount, uint256 _pricePerToken) external nonReentrant {
        require(!playerInfo.tournamentCompleted, "Tournament already completed");
        require(_tokenAmount > 0, "Token amount must be greater than 0");
        require(_tokenAmount <= 10_000, "Token amount exceeds maximum (10,000)");
        require(_pricePerToken > 0, "Price per token must be greater than 0");
        require(balanceOf(msg.sender) >= _tokenAmount, "Insufficient token balance");
        
        // Lock tokens for the sell order
        _transfer(msg.sender, address(this), _tokenAmount);
        
        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            trader: msg.sender,
            tokenAmount: _tokenAmount,
            pricePerToken: _pricePerToken,
            isBuyOrder: false,
            isActive: true,
            timestamp: block.timestamp
        });
        
        totalOrders++;
        emit OrderCreated(orderId, msg.sender, _tokenAmount, _pricePerToken, false);
    }
    
    /**
     * @dev Execute a buy order (buy tokens from a sell order)
     */
    function executeBuyOrder(uint256 _orderId) external payable nonReentrant {
        Order storage order = orders[_orderId];
        require(order.isActive, "Order is not active");
        require(!order.isBuyOrder, "Cannot execute buy order with this function");
        require(!playerInfo.tournamentCompleted, "Cannot trade after tournament completion");
        require(msg.sender != owner(), "Token creator cannot purchase their own tokens");
        
        uint256 totalCost = order.tokenAmount * order.pricePerToken;
        require(msg.value >= totalCost, "Insufficient ETH sent");
        
        // Transfer tokens to buyer
        _transfer(address(this), msg.sender, order.tokenAmount);
        
        // Transfer ETH to seller
        payable(order.trader).transfer(totalCost);
        
        // Refund excess ETH
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        // Mark order as inactive
        order.isActive = false;
        
        emit OrderExecuted(_orderId, msg.sender, order.trader, order.tokenAmount, totalCost);
    }
    
    /**
     * @dev Execute a sell order (sell tokens to a buy order)
     */
    function executeSellOrder(uint256 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.isActive, "Order is not active");
        require(order.isBuyOrder, "Cannot execute sell order with this function");
        require(!playerInfo.tournamentCompleted, "Cannot trade after tournament completion");
        require(balanceOf(msg.sender) >= order.tokenAmount, "Insufficient token balance");
        require(order.trader != owner(), "Token creator cannot purchase their own tokens");
        
        uint256 totalCost = order.tokenAmount * order.pricePerToken;
        require(address(this).balance >= totalCost, "Insufficient contract balance");
        
        // Transfer tokens from seller to buyer
        _transfer(msg.sender, order.trader, order.tokenAmount);
        
        // Transfer ETH from contract to seller
        payable(msg.sender).transfer(totalCost);
        
        // Mark order as inactive
        order.isActive = false;
        
        emit OrderExecuted(_orderId, order.trader, msg.sender, order.tokenAmount, totalCost);
    }
    
    /**
     * @dev Cancel an active order
     */
    function cancelOrder(uint256 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.isActive, "Order is not active");
        require(order.trader == msg.sender, "Only order creator can cancel");
        
        if (order.isBuyOrder) {
            // Refund ETH for buy order
            uint256 refundAmount = order.tokenAmount * order.pricePerToken;
            require(address(this).balance >= refundAmount, "Insufficient contract balance");
            payable(msg.sender).transfer(refundAmount);
        } else {
            // Return tokens for sell order
            _transfer(address(this), msg.sender, order.tokenAmount);
        }
        
        order.isActive = false;
        emit OrderCancelled(_orderId);
    }
    
    /**
     * @dev Get active orders
     */
    function getActiveOrders() external view returns (uint256[] memory) {
        uint256[] memory activeOrderIds = new uint256[](totalOrders);
        uint256 count = 0;
        
        for (uint256 i = 0; i < nextOrderId; i++) {
            if (orders[i].isActive) {
                activeOrderIds[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeOrderIds[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get order details
     */
    function getOrder(uint256 _orderId) external view returns (
        address trader,
        uint256 tokenAmount,
        uint256 pricePerToken,
        bool isBuyOrder,
        bool isActive,
        uint256 timestamp
    ) {
        Order memory order = orders[_orderId];
        return (
            order.trader,
            order.tokenAmount,
            order.pricePerToken,
            order.isBuyOrder,
            order.isActive,
            order.timestamp
        );
    }
    
    /**
     * @dev Get contract ETH balance (for buy orders)
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Refund all buyers when token is deleted
     * @notice This function should only be called by TournamentManager when deactivating
     * @notice Applies a 3% service fee to refunds
     */
    function refundAllBuyers() external onlyOwner nonReentrant {
        require(!playerInfo.tournamentCompleted, "Cannot refund completed tournament");
        require(address(this).balance > 0, "No funds to refund");
        
        uint256 totalRefunded = 0;
        uint256 buyersRefunded = 0;
        uint256 serviceFeePercentage = 3; // 3% service fee
        
        for (uint256 i = 0; i < buyers.length; i++) {
            address buyer = buyers[i];
            uint256 purchaseAmount = buyerPurchaseAmount[buyer];
            
            if (purchaseAmount > 0) {
                // Calculate refund amount (97% of purchase, 3% service fee)
                uint256 serviceFee = (purchaseAmount * serviceFeePercentage) / 100;
                uint256 refundAmount = purchaseAmount - serviceFee;
                
                // Reset buyer's purchase amount before transfer (reentrancy protection)
                buyerPurchaseAmount[buyer] = 0;
                
                // Transfer refund
                (bool success, ) = payable(buyer).call{value: refundAmount}("");
                if (success) {
                    totalRefunded += refundAmount;
                    buyersRefunded++;
                    emit BuyerRefunded(buyer, refundAmount);
                } else {
                    // If transfer fails, restore the amount so they can claim manually
                    buyerPurchaseAmount[buyer] = purchaseAmount;
                }
            }
        }
        
        emit TokenDeleted(address(this), totalRefunded, buyersRefunded);
    }
    
    /**
     * @dev Get list of all buyers
     */
    function getBuyers() external view returns (address[] memory) {
        return buyers;
    }
    
    /**
     * @dev Get number of buyers
     */
    function getBuyersCount() external view returns (uint256) {
        return buyers.length;
    }

    /**
     * @dev Receive function to accept ETH transfers
     */
    receive() external payable {
        // Allow ETH to be sent to the contract for winnings and buy orders
    }
}

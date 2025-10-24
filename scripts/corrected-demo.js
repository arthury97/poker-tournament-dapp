const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Starting CORRECTED Poker Player Token Demo...\n");

  // Get signers (simulating different users)
  const [player, investor1, investor2, investor3, investor4, investor5] = await ethers.getSigners();
  
  console.log("👥 Demo Participants:");
  console.log("Player (Token Creator):", player.address);
  console.log("Investor 1:", investor1.address);
  console.log("Investor 2:", investor2.address);
  console.log("Investor 3:", investor3.address);
  console.log("Investor 4:", investor4.address);
  console.log("Investor 5:", investor5.address);
  console.log("");

  // Get contract factories
  const TournamentManager = await ethers.getContractFactory("TournamentManager");
  const PokerTournamentToken = await ethers.getContractFactory("PokerTournamentToken");

  // Deploy TournamentManager
  console.log("📋 Deploying TournamentManager...");
  const tournamentManager = await TournamentManager.deploy();
  await tournamentManager.waitForDeployment();
  const managerAddress = await tournamentManager.getAddress();
  console.log("✅ TournamentManager deployed to:", managerAddress);
  console.log("");

  // Create player token (player selling shares of their potential winnings)
  console.log("🏆 Creating Player Token...");
  console.log("Player Token Details:");
  console.log("- Player Name: Alice the Poker Pro");
  console.log("- Symbol: ALICE");
  console.log("- Buy-in: 1.0 ETH");
  console.log("- Total Tokens: 100");
  console.log("- Profit Share: 35%");
  console.log("");

  const tx = await tournamentManager.connect(player).createPlayerToken(
    "Alice the Poker Pro",
    "ALICE",
    ethers.parseEther("1.0"), // 1 ETH buy-in
    100, // 100 tokens
    35 // 35% profit share
  );

  const receipt = await tx.wait();
  
  // Find the PlayerTokenCreated event
  const event = receipt.logs.find(log => {
    try {
      const parsed = tournamentManager.interface.parseLog(log);
      return parsed.name === 'PlayerTokenCreated';
    } catch {
      return false;
    }
  });

  if (event) {
    const parsedEvent = tournamentManager.interface.parseLog(event);
    const playerTokenAddress = parsedEvent.args.playerTokenAddress;
    console.log("✅ Player token created at:", playerTokenAddress);
    console.log("");

    // Get the player token contract
    const playerToken = PokerTournamentToken.attach(playerTokenAddress);

    // Check initial state
    console.log("📊 Initial Player Token State:");
    const initialInfo = await playerToken.getPlayerInfo();
    console.log("- Tokens Sold:", Number(initialInfo.tokensSold));
    console.log("- Remaining Tokens:", Number(initialInfo.totalTokens) - Number(initialInfo.tokensSold));
    console.log("- Token Price:", ethers.formatEther(await playerToken.getTokenPrice()), "ETH");
    console.log("");

    // Simulate 5 investors buying 20 tokens each (100 tokens total)
    console.log("💰 Simulating Token Purchases by Investors...");
    const tokenPrice = await playerToken.getTokenPrice();
    const tokensPerInvestor = 20;
    const ethPerInvestor = tokenPrice * BigInt(tokensPerInvestor);

    const investors = [investor1, investor2, investor3, investor4, investor5];
    const investorNames = ["Bob", "Charlie", "Diana", "Eve", "Frank"];

    for (let i = 0; i < investors.length; i++) {
      console.log(`👤 ${investorNames[i]} (${investors[i].address.slice(0, 10)}...) buying ${tokensPerInvestor} tokens...`);
      
      const tx = await playerToken.connect(investors[i]).purchaseTokens({
        value: ethPerInvestor
      });
      await tx.wait();
      
      const balance = await playerToken.balanceOf(investors[i].address);
      console.log(`✅ ${investorNames[i]} now owns ${Number(balance)} tokens`);
    }
    console.log("");

    // Check state after all purchases
    console.log("📊 Player Token State After All Purchases:");
    const afterPurchaseInfo = await playerToken.getPlayerInfo();
    console.log("- Total Tokens Sold:", Number(afterPurchaseInfo.tokensSold));
    console.log("- Remaining Tokens:", Number(afterPurchaseInfo.totalTokens) - Number(afterPurchaseInfo.tokensSold));
    console.log("- Contract ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(playerTokenAddress)), "ETH");
    console.log("");

    // Player withdraws for tournament buy-in
    console.log("💸 Player Withdrawing for Tournament Buy-in...");
    const withdrawTx = await playerToken.connect(player).withdrawForBuyIn();
    await withdrawTx.wait();
    console.log("✅ Buy-in funds withdrawn by player");
    console.log("");

    // Simulate player winning 10 ETH in the tournament
    console.log("🎉 Player Won the Tournament! Alice takes 10 ETH!");
    console.log("📈 Calculating Profit Distribution...");
    
    // Send 10 ETH to the contract to simulate player's winnings
    const playerWinnings = ethers.parseEther("10.0");
    const sendWinningsTx = await player.sendTransaction({
      to: playerTokenAddress,
      value: playerWinnings
    });
    await sendWinningsTx.wait();
    console.log("✅ 10 ETH sent to contract as player's winnings");
    console.log("");

    // Complete the player's tournament
    const completeTx = await playerToken.connect(player).completePlayerTournament(playerWinnings);
    await completeTx.wait();
    console.log("✅ Player's tournament marked as completed with 10 ETH winnings");
    console.log("");

    // Calculate and show profit distribution
    console.log("💎 Profit Distribution Analysis:");
    const totalWinnings = 10.0; // ETH
    const profitSharePercentage = 35; // %
    const shareableWinnings = totalWinnings * (profitSharePercentage / 100);
    console.log(`- Player's Total Winnings: ${totalWinnings} ETH`);
    console.log(`- Profit Share: ${profitSharePercentage}%`);
    console.log(`- Shareable Winnings: ${shareableWinnings} ETH`);
    console.log(`- Tokens per Investor: ${tokensPerInvestor}`);
    console.log(`- Total Tokens Sold: ${Number(afterPurchaseInfo.tokensSold)}`);
    console.log(`- Winnings per Token: ${shareableWinnings / Number(afterPurchaseInfo.tokensSold)} ETH`);
    console.log(`- Winnings per Investor: ${(shareableWinnings / Number(afterPurchaseInfo.tokensSold)) * tokensPerInvestor} ETH`);
    console.log("");

    // Each investor claims their winnings
    console.log("🎁 Investors Claiming Their Share of Player's Winnings...");
    for (let i = 0; i < investors.length; i++) {
      const investorBalance = await playerToken.balanceOf(investors[i].address);
      const potentialWinnings = await playerToken.getPotentialWinnings(investors[i].address);
      
      console.log(`👤 ${investorNames[i]} claiming winnings...`);
      console.log(`   - Token Balance: ${Number(investorBalance)}`);
      console.log(`   - Potential Winnings: ${ethers.formatEther(potentialWinnings)} ETH`);
      
      const claimTx = await playerToken.connect(investors[i]).claimWinnings();
      await claimTx.wait();
      
      console.log(`✅ ${investorNames[i]} claimed ${ethers.formatEther(potentialWinnings)} ETH`);
    }
    console.log("");

    // Final state
    console.log("📊 Final Player Token State:");
    const finalInfo = await playerToken.getPlayerInfo();
    console.log("- Player's Tournament Completed:", finalInfo.tournamentCompleted);
    console.log("- Player's Total Winnings:", ethers.formatEther(finalInfo.playerWinnings), "ETH");
    console.log("- Winnings Distributed:", finalInfo.winningsDistributed);
    console.log("- Contract ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(playerTokenAddress)), "ETH");
    console.log("");

    // Summary
    console.log("🎯 CORRECTED Demo Summary:");
    console.log("✅ Player (Alice) created tokens to sell shares of her potential winnings");
    console.log("✅ 5 investors bought 20 tokens each (100 tokens total)");
    console.log("✅ Player used the raised funds to enter a poker tournament");
    console.log("✅ Player won 10 ETH in the tournament");
    console.log("✅ 3.5 ETH distributed to token holders (35% of player's winnings)");
    console.log("✅ Each investor received 0.7 ETH (20 tokens × 0.035 ETH per token)");
    console.log("✅ Player kept 6.5 ETH (65% of her winnings)");
    console.log("");

    console.log("🎉 CORRECTED Demo completed successfully!");
    console.log("📋 Contract Addresses:");
    console.log("- TournamentManager:", managerAddress);
    console.log("- Player Token:", playerTokenAddress);
    console.log("");
    console.log("🌐 You can now interact with these contracts in your frontend!");

  } else {
    console.error("❌ Failed to get player token address from transaction");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  });


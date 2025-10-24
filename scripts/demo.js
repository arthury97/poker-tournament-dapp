const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Starting Poker Tournament DApp Demo...\n");

  // Get signers (simulating different users)
  const [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();
  
  console.log("👥 Demo Participants:");
  console.log("Owner (Tournament Creator):", owner.address);
  console.log("User 1:", user1.address);
  console.log("User 2:", user2.address);
  console.log("User 3:", user3.address);
  console.log("User 4:", user4.address);
  console.log("User 5:", user5.address);
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

  // Create demo tournament
  console.log("🏆 Creating Demo Tournament...");
  console.log("Tournament Details:");
  console.log("- Name: World Series of Poker Demo");
  console.log("- Symbol: WSOP");
  console.log("- Buy-in: 1.0 ETH");
  console.log("- Total Tokens: 100");
  console.log("- Profit Share: 35%");
  console.log("");

  const tx = await tournamentManager.connect(owner).createTournament(
    "World Series of Poker Demo",
    "WSOP",
    ethers.parseEther("1.0"), // 1 ETH buy-in
    100, // 100 tokens
    35 // 35% profit share
  );

  const receipt = await tx.wait();
  
  // Find the TournamentCreated event
  const event = receipt.logs.find(log => {
    try {
      const parsed = tournamentManager.interface.parseLog(log);
      return parsed.name === 'TournamentCreated';
    } catch {
      return false;
    }
  });

  if (event) {
    const parsedEvent = tournamentManager.interface.parseLog(event);
    const tournamentAddress = parsedEvent.args.tournamentAddress;
    console.log("✅ Tournament created at:", tournamentAddress);
    console.log("");

    // Get the tournament contract
    const tournament = PokerTournamentToken.attach(tournamentAddress);

    // Check initial state
    console.log("📊 Initial Tournament State:");
    const initialInfo = await tournament.getTournamentInfo();
    console.log("- Tokens Sold:", Number(initialInfo.tokensSold));
    console.log("- Remaining Tokens:", Number(initialInfo.totalTokens) - Number(initialInfo.tokensSold));
    console.log("- Token Price:", ethers.formatEther(await tournament.getTokenPrice()), "ETH");
    console.log("");

    // Simulate 5 people buying 20 tokens each (100 tokens total)
    console.log("💰 Simulating Token Purchases...");
    const tokenPrice = await tournament.getTokenPrice();
    const tokensPerPerson = 20;
    const ethPerPerson = tokenPrice * BigInt(tokensPerPerson);

    const users = [user1, user2, user3, user4, user5];
    const userNames = ["Alice", "Bob", "Charlie", "Diana", "Eve"];

    for (let i = 0; i < users.length; i++) {
      console.log(`👤 ${userNames[i]} (${users[i].address.slice(0, 10)}...) buying ${tokensPerPerson} tokens...`);
      
      const tx = await tournament.connect(users[i]).purchaseTokens({
        value: ethPerPerson
      });
      await tx.wait();
      
      const balance = await tournament.balanceOf(users[i].address);
      console.log(`✅ ${userNames[i]} now owns ${Number(balance)} tokens`);
    }
    console.log("");

    // Check state after all purchases
    console.log("📊 Tournament State After All Purchases:");
    const afterPurchaseInfo = await tournament.getTournamentInfo();
    console.log("- Total Tokens Sold:", Number(afterPurchaseInfo.tokensSold));
    console.log("- Remaining Tokens:", Number(afterPurchaseInfo.totalTokens) - Number(afterPurchaseInfo.tokensSold));
    console.log("- Contract ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(tournamentAddress)), "ETH");
    console.log("");

    // Owner withdraws for buy-in
    console.log("💸 Tournament Creator Withdrawing for Buy-in...");
    const withdrawTx = await tournament.connect(owner).withdrawForBuyIn();
    await withdrawTx.wait();
    console.log("✅ Buy-in funds withdrawn by tournament creator");
    console.log("");

    // Simulate tournament completion with 10 ETH winnings
    console.log("🎉 Tournament Completed! Winner takes 10 ETH!");
    console.log("📈 Calculating Profit Distribution...");
    
    // Send 10 ETH to the contract to simulate winnings
    const winningsAmount = ethers.parseEther("10.0");
    const sendWinningsTx = await owner.sendTransaction({
      to: tournamentAddress,
      value: winningsAmount
    });
    await sendWinningsTx.wait();
    console.log("✅ 10 ETH sent to contract as winnings");
    console.log("");

    // Complete the tournament
    const completeTx = await tournament.connect(owner).completeTournament(winningsAmount);
    await completeTx.wait();
    console.log("✅ Tournament marked as completed with 10 ETH winnings");
    console.log("");

    // Calculate and show profit distribution
    console.log("💎 Profit Distribution Analysis:");
    const totalWinnings = 10.0; // ETH
    const profitSharePercentage = 35; // %
    const shareableWinnings = totalWinnings * (profitSharePercentage / 100);
    console.log(`- Total Winnings: ${totalWinnings} ETH`);
    console.log(`- Profit Share: ${profitSharePercentage}%`);
    console.log(`- Shareable Winnings: ${shareableWinnings} ETH`);
    console.log(`- Tokens per Person: ${tokensPerPerson}`);
    console.log(`- Total Tokens Sold: ${Number(afterPurchaseInfo.tokensSold)}`);
    console.log(`- Winnings per Token: ${shareableWinnings / Number(afterPurchaseInfo.tokensSold)} ETH`);
    console.log(`- Winnings per Person: ${(shareableWinnings / Number(afterPurchaseInfo.tokensSold)) * tokensPerPerson} ETH`);
    console.log("");

    // Each user claims their winnings
    console.log("🎁 Claiming Winnings...");
    for (let i = 0; i < users.length; i++) {
      const userBalance = await tournament.balanceOf(users[i].address);
      const potentialWinnings = await tournament.getPotentialWinnings(users[i].address);
      
      console.log(`👤 ${userNames[i]} claiming winnings...`);
      console.log(`   - Token Balance: ${Number(userBalance)}`);
      console.log(`   - Potential Winnings: ${ethers.formatEther(potentialWinnings)} ETH`);
      
      const claimTx = await tournament.connect(users[i]).claimWinnings();
      await claimTx.wait();
      
      console.log(`✅ ${userNames[i]} claimed ${ethers.formatEther(potentialWinnings)} ETH`);
    }
    console.log("");

    // Final state
    console.log("📊 Final Tournament State:");
    const finalInfo = await tournament.getTournamentInfo();
    console.log("- Tournament Completed:", finalInfo.tournamentCompleted);
    console.log("- Total Winnings:", ethers.formatEther(finalInfo.totalWinnings), "ETH");
    console.log("- Winnings Distributed:", finalInfo.winningsDistributed);
    console.log("- Contract ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(tournamentAddress)), "ETH");
    console.log("");

    // Summary
    console.log("🎯 Demo Summary:");
    console.log("✅ Tournament created with 100 tokens and 35% profit share");
    console.log("✅ 5 people bought 20 tokens each (100 tokens total)");
    console.log("✅ Tournament completed with 10 ETH winnings");
    console.log("✅ 3.5 ETH distributed to token holders (35% of 10 ETH)");
    console.log("✅ Each person received 0.7 ETH (20 tokens × 0.035 ETH per token)");
    console.log("✅ Tournament creator kept 6.5 ETH (65% of winnings)");
    console.log("");

    console.log("🎉 Demo completed successfully!");
    console.log("📋 Contract Addresses:");
    console.log("- TournamentManager:", managerAddress);
    console.log("- Demo Tournament:", tournamentAddress);
    console.log("");
    console.log("🌐 You can now interact with these contracts in your frontend!");

  } else {
    console.error("❌ Failed to get tournament address from transaction");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  });

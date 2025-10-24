const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Starting Poker Player Token Trading Demo...\n");

  // Get signers (simulating different users)
  const [player, investor1, investor2, investor3, trader1, trader2] = await ethers.getSigners();
  
  console.log("👥 Demo Participants:");
  console.log("Player (Token Creator):", player.address);
  console.log("Investor 1:", investor1.address);
  console.log("Investor 2:", investor2.address);
  console.log("Investor 3:", investor3.address);
  console.log("Trader 1:", trader1.address);
  console.log("Trader 2:", trader2.address);
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

  // Create player token
  console.log("🏆 Creating Player Token...");
  console.log("Player Token Details:");
  console.log("- Player Name: Alice the Poker Pro");
  console.log("- Symbol: ALICE");
  console.log("- Buy-in: 2 ETH");
  console.log("- Total Tokens: 200");
  console.log("- Profit Share: 40%");
  console.log("");

  const tx = await tournamentManager.connect(player).createPlayerToken(
    "Alice the Poker Pro",
    "ALICE",
    ethers.parseEther("2.0"), // 2 ETH buy-in
    200, // 200 tokens
    40 // 40% profit share
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

    // Simulate initial token purchases
    console.log("💰 Initial Token Purchases...");
    const tokenPrice = await playerToken.getTokenPrice();
    const initialTokensPerInvestor = 50; // 50 tokens each
    const initialEthPerInvestor = tokenPrice * BigInt(initialTokensPerInvestor);

    const initialInvestors = [investor1, investor2, investor3];

    for (let i = 0; i < initialInvestors.length; i++) {
      console.log(`👤 Investor ${i + 1} buying ${initialTokensPerInvestor} tokens...`);
      
      const tx = await playerToken.connect(initialInvestors[i]).purchaseTokens({
        value: initialEthPerInvestor
      });
      await tx.wait();
      
      const balance = await playerToken.balanceOf(initialInvestors[i].address);
      console.log(`✅ Investor ${i + 1} now owns ${Number(balance)} tokens`);
    }
    console.log("");

    // Check state after initial purchases
    console.log("📊 State After Initial Purchases:");
    const afterInitialInfo = await playerToken.getPlayerInfo();
    console.log("- Total Tokens Sold:", Number(afterInitialInfo.tokensSold));
    console.log("- Remaining Tokens:", Number(afterInitialInfo.totalTokens) - Number(afterInitialInfo.tokensSold));
    console.log("- Contract ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(playerTokenAddress)), "ETH");
    console.log("");

    // Now demonstrate trading functionality
    console.log("📈 Starting Trading Demo...");
    console.log("");

    // 1. Create a sell order
    console.log("🔴 Creating Sell Order...");
    const sellAmount = 20;
    const sellPrice = ethers.parseEther("0.012"); // 0.012 ETH per token
    
    const sellTx = await playerToken.connect(investor1).createSellOrder(sellAmount, sellPrice);
    await sellTx.wait();
    console.log(`✅ Investor 1 created sell order: ${sellAmount} tokens at ${ethers.formatEther(sellPrice)} ETH/token`);
    console.log("");

    // 2. Create a buy order
    console.log("🟢 Creating Buy Order...");
    const buyAmount = 15;
    const buyPrice = ethers.parseEther("0.011"); // 0.011 ETH per token
    const buyTotalCost = BigInt(buyAmount) * buyPrice;
    
    const buyTx = await playerToken.connect(trader1).createBuyOrder(buyAmount, buyPrice, {
      value: buyTotalCost
    });
    await buyTx.wait();
    console.log(`✅ Trader 1 created buy order: ${buyAmount} tokens at ${ethers.formatEther(buyPrice)} ETH/token`);
    console.log("");

    // 3. Create another sell order
    console.log("🔴 Creating Another Sell Order...");
    const sellAmount2 = 10;
    const sellPrice2 = ethers.parseEther("0.013"); // 0.013 ETH per token
    
    const sellTx2 = await playerToken.connect(investor2).createSellOrder(sellAmount2, sellPrice2);
    await sellTx2.wait();
    console.log(`✅ Investor 2 created sell order: ${sellAmount2} tokens at ${ethers.formatEther(sellPrice2)} ETH/token`);
    console.log("");

    // 4. Check active orders
    console.log("📋 Checking Active Orders...");
    const activeOrders = await playerToken.getActiveOrders();
    console.log(`- Total Active Orders: ${activeOrders.length}`);
    
    for (let i = 0; i < activeOrders.length; i++) {
      const orderId = activeOrders[i];
      const order = await playerToken.getOrder(orderId);
      const orderType = order.isBuyOrder ? "🟢 Buy" : "🔴 Sell";
      console.log(`  ${orderType} Order #${orderId}: ${order.tokenAmount} tokens at ${ethers.formatEther(order.pricePerToken)} ETH/token`);
    }
    console.log("");

    // 5. Execute a trade (Trader 2 buys from Investor 1's sell order)
    console.log("⚡ Executing Trade...");
    let sellOrderId;
    for (const id of activeOrders) {
      const order = await playerToken.getOrder(id);
      if (!order.isBuyOrder) {
        sellOrderId = id;
        break;
      }
    }
    
    if (sellOrderId !== undefined) {
      const order = await playerToken.getOrder(sellOrderId);
      const totalCost = order.tokenAmount * order.pricePerToken;
      
      console.log(`👤 Trader 2 executing buy from sell order #${sellOrderId}...`);
      console.log(`   - Buying: ${order.tokenAmount} tokens`);
      console.log(`   - Price: ${ethers.formatEther(order.pricePerToken)} ETH/token`);
      console.log(`   - Total Cost: ${ethers.formatEther(totalCost)} ETH`);
      
      const executeTx = await playerToken.connect(trader2).executeBuyOrder(sellOrderId, {
        value: totalCost
      });
      await executeTx.wait();
      
      console.log("✅ Trade executed successfully!");
      
      // Check balances after trade
      const trader2Balance = await playerToken.balanceOf(trader2.address);
      const investor1Balance = await playerToken.balanceOf(investor1.address);
      console.log(`   - Trader 2 now owns: ${Number(trader2Balance)} tokens`);
      console.log(`   - Investor 1 now owns: ${Number(investor1Balance)} tokens`);
    }
    console.log("");

    // 6. Check updated active orders
    console.log("📋 Updated Active Orders...");
    const updatedActiveOrders = await playerToken.getActiveOrders();
    console.log(`- Total Active Orders: ${updatedActiveOrders.length}`);
    
    for (let i = 0; i < updatedActiveOrders.length; i++) {
      const orderId = updatedActiveOrders[i];
      const order = await playerToken.getOrder(orderId);
      const orderType = order.isBuyOrder ? "🟢 Buy" : "🔴 Sell";
      console.log(`  ${orderType} Order #${orderId}: ${order.tokenAmount} tokens at ${ethers.formatEther(order.pricePerToken)} ETH/token`);
    }
    console.log("");

    // 7. Cancel an order
    console.log("❌ Cancelling Order...");
    if (updatedActiveOrders.length > 0) {
      const orderToCancel = updatedActiveOrders[0];
      const order = await playerToken.getOrder(orderToCancel);
      const orderType = order.isBuyOrder ? "buy" : "sell";
      
      // Find the correct signer for the order trader
      let orderSigner;
      if (order.trader === trader1.address) {
        orderSigner = trader1;
        console.log(`👤 Trader 1 cancelling ${orderType} order #${orderToCancel}...`);
      } else if (order.trader === investor1.address) {
        orderSigner = investor1;
        console.log(`👤 Investor 1 cancelling ${orderType} order #${orderToCancel}...`);
      } else if (order.trader === investor2.address) {
        orderSigner = investor2;
        console.log(`👤 Investor 2 cancelling ${orderType} order #${orderToCancel}...`);
      } else {
        console.log(`👤 Unknown trader cancelling ${orderType} order #${orderToCancel}...`);
        orderSigner = trader1; // fallback
      }
      
      const cancelTx = await playerToken.connect(orderSigner).cancelOrder(orderToCancel);
      await cancelTx.wait();
      
      console.log("✅ Order cancelled successfully!");
    }
    console.log("");

    // 8. Final state check
    console.log("📊 Final Trading State:");
    const finalActiveOrders = await playerToken.getActiveOrders();
    console.log(`- Total Active Orders: ${finalActiveOrders.length}`);
    console.log("- Contract ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(playerTokenAddress)), "ETH");
    console.log("");

    // 9. Show token balances
    console.log("💼 Final Token Balances:");
    const addresses = [player.address, investor1.address, investor2.address, investor3.address, trader1.address, trader2.address];
    const names = ["Player", "Investor 1", "Investor 2", "Investor 3", "Trader 1", "Trader 2"];
    
    for (let i = 0; i < addresses.length; i++) {
      const balance = await playerToken.balanceOf(addresses[i]);
      console.log(`- ${names[i]}: ${Number(balance)} tokens`);
    }
    console.log("");

    console.log("🎯 Trading Demo Summary:");
    console.log("✅ Player created tokens with trading functionality");
    console.log("✅ Initial investors bought tokens");
    console.log("✅ Users created buy and sell orders");
    console.log("✅ Trades were executed successfully");
    console.log("✅ Orders were cancelled when needed");
    console.log("✅ Token balances updated correctly");
    console.log("");

    console.log("🎉 Trading Demo completed successfully!");
    console.log("📋 Contract Addresses:");
    console.log("- TournamentManager:", managerAddress);
    console.log("- Player Token:", playerTokenAddress);
    console.log("");
    console.log("🌐 You can now interact with the trading system in your frontend!");

  } else {
    console.error("❌ Failed to get player token address from transaction");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Trading demo failed:", error);
    process.exit(1);
  });

/**
 * Deploy contracts to Ethereum Mainnet
 * 
 * ⚠️ WARNING: This script deploys to MAINNET - real ETH will be spent
 * 
 * Before running:
 * 1. Ensure you have sufficient ETH in your deployment wallet
 * 2. Backup your private key securely
 * 3. Have completed a professional security audit
 * 4. Test thoroughly on testnets first
 * 
 * Usage: npx hardhat run scripts/deploy-mainnet.js --network mainnet
 */

const hre = require("hardhat");

async function main() {
  console.log("\n🚨 ========================================");
  console.log("🚨 DEPLOYING TO ETHEREUM MAINNET");
  console.log("🚨 ========================================\n");

  // Verify we're on mainnet
  const network = await hre.ethers.provider.getNetwork();
  console.log("📡 Network:", network.name);
  console.log("📡 Chain ID:", network.chainId.toString());

  if (network.chainId !== 1n) {
    console.error("\n❌ ERROR: Not connected to Ethereum Mainnet!");
    console.error("Expected Chain ID: 1");
    console.error("Current Chain ID:", network.chainId.toString());
    process.exit(1);
  }

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  
  console.log("👤 Deployer address:", deployerAddress);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH");

  // Check if deployer has enough ETH
  const minBalance = hre.ethers.parseEther("0.5"); // Minimum 0.5 ETH
  if (balance < minBalance) {
    console.error("\n❌ ERROR: Insufficient balance!");
    console.error("Minimum required:", hre.ethers.formatEther(minBalance), "ETH");
    console.error("Current balance:", hre.ethers.formatEther(balance), "ETH");
    process.exit(1);
  }

  console.log("\n⚠️  Final confirmation required before deployment...");
  console.log("⚠️  You are about to deploy to ETHEREUM MAINNET");
  console.log("⚠️  This will consume real ETH");
  console.log("\n⏰ You have 10 seconds to cancel (Ctrl+C)...\n");

  // 10 second countdown
  for (let i = 10; i > 0; i--) {
    process.stdout.write(`⏱️  ${i}... `);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log("\n\n🚀 Starting deployment...\n");

  // Deploy TournamentManager
  console.log("📝 Deploying TournamentManager...");
  const TournamentManager = await hre.ethers.getContractFactory("TournamentManager");
  const tournamentManager = await TournamentManager.deploy();
  
  console.log("⏳ Waiting for deployment transaction...");
  await tournamentManager.waitForDeployment();
  
  const tournamentManagerAddress = await tournamentManager.getAddress();
  console.log("✅ TournamentManager deployed to:", tournamentManagerAddress);

  // Wait for a few block confirmations
  console.log("\n⏳ Waiting for 5 block confirmations for security...");
  await tournamentManager.deploymentTransaction().wait(5);
  console.log("✅ Confirmed!");

  // Get deployment cost
  const deployTx = tournamentManager.deploymentTransaction();
  const receipt = await deployTx.wait();
  const gasCost = receipt.gasUsed * receipt.gasPrice;
  console.log("\n💸 Deployment cost:", hre.ethers.formatEther(gasCost), "ETH");

  // Print summary
  console.log("\n🎉 ========================================");
  console.log("🎉 DEPLOYMENT SUCCESSFUL");
  console.log("🎉 ========================================\n");
  
  console.log("📋 Deployment Summary:");
  console.log("├─ Network:", network.name);
  console.log("├─ Chain ID:", network.chainId.toString());
  console.log("├─ Deployer:", deployerAddress);
  console.log("├─ TournamentManager:", tournamentManagerAddress);
  console.log("├─ Gas Used:", receipt.gasUsed.toString());
  console.log("└─ Deployment Cost:", hre.ethers.formatEther(gasCost), "ETH");

  console.log("\n📝 NEXT STEPS:");
  console.log("1. Verify contracts on Etherscan:");
  console.log(`   npx hardhat verify --network mainnet ${tournamentManagerAddress}`);
  console.log("\n2. Update frontend Web3Context.js with new address:");
  console.log(`   TOURNAMENT_MANAGER_ADDRESS = "${tournamentManagerAddress}"`);
  console.log("\n3. Test all functionality on mainnet");
  console.log("\n4. Monitor first transactions carefully");
  console.log("\n5. Set up contract monitoring and alerts");

  console.log("\n📊 Etherscan Links:");
  console.log(`   TournamentManager: https://etherscan.io/address/${tournamentManagerAddress}`);

  console.log("\n⚠️  IMPORTANT REMINDERS:");
  console.log("- Keep deployment addresses secure");
  console.log("- Monitor contract for unusual activity");
  console.log("- Have emergency pause mechanisms ready");
  console.log("- Set up multisig wallet for contract ownership\n");

  // Save deployment info to file
  const fs = require('fs');
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployerAddress,
    contracts: {
      TournamentManager: tournamentManagerAddress
    },
    timestamp: new Date().toISOString(),
    blockNumber: receipt.blockNumber.toString(),
    gasUsed: receipt.gasUsed.toString(),
    deploymentCost: hre.ethers.formatEther(gasCost)
  };

  fs.writeFileSync(
    'mainnet-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to mainnet-deployment.json\n");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });


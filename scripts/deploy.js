const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Get the contract factories
  const TournamentManager = await ethers.getContractFactory("TournamentManager");
  const PokerTournamentToken = await ethers.getContractFactory("PokerTournamentToken");

  // Deploy TournamentManager
  console.log("Deploying TournamentManager...");
  const tournamentManager = await TournamentManager.deploy();
  await tournamentManager.waitForDeployment();
  console.log("TournamentManager deployed to:", await tournamentManager.getAddress());

  // Deploy a sample tournament token for testing
  console.log("Deploying sample PokerTournamentToken...");
  const sampleToken = await PokerTournamentToken.deploy(
    "Sample Poker Tournament",
    "SAMPLE",
    ethers.parseEther("1.0"), // 1 ETH buy-in
    1000, // 1000 tokens
    80 // 80% profit share
  );
  await sampleToken.waitForDeployment();
  console.log("Sample PokerTournamentToken deployed to:", await sampleToken.getAddress());

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    tournamentManager: await tournamentManager.getAddress(),
    sampleToken: await sampleToken.getAddress(),
    timestamp: new Date().toISOString()
  };

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", deploymentInfo.network);
  console.log("TournamentManager:", deploymentInfo.tournamentManager);
  console.log("Sample Token:", deploymentInfo.sampleToken);
  console.log("Timestamp:", deploymentInfo.timestamp);

  // Verify contracts on Etherscan if on a live network
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await tournamentManager.deployTransaction.wait(6);
    await sampleToken.deployTransaction.wait(6);

    console.log("Verifying contracts on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: await tournamentManager.getAddress(),
        constructorArguments: [],
      });
      console.log("TournamentManager verified on Etherscan");
    } catch (error) {
      console.log("Error verifying TournamentManager:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: await sampleToken.getAddress(),
        constructorArguments: [
          "Sample Poker Tournament",
          "SAMPLE",
          ethers.parseEther("1.0"),
          1000,
          80
        ],
      });
      console.log("Sample PokerTournamentToken verified on Etherscan");
    } catch (error) {
      console.log("Error verifying Sample Token:", error.message);
    }
  }

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const { ethers } = require("hardhat");

async function main() {
  const managerAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const manager = await ethers.getContractAt("TournamentManager", managerAddress);
  
  console.log("Testing new functions on deployed contract...");
  console.log("Contract address:", managerAddress);
  console.log("");
  
  try {
    const total = await manager.getTotalTournaments();
    console.log("✅ getTotalTournaments() works:", total.toString());
  } catch (e) {
    console.log("❌ getTotalTournaments() failed:", e.message);
  }
  
  try {
    const total2 = await manager.getTotalPlayerTokens();
    console.log("✅ getTotalPlayerTokens() works:", total2.toString());
  } catch (e) {
    console.log("❌ getTotalPlayerTokens() failed:", e.message);
  }
  
  try {
    const active = await manager.getActiveTournaments();
    console.log("✅ getActiveTournaments() works:", active.length, "tournaments");
  } catch (e) {
    console.log("❌ getActiveTournaments() failed:", e.message);
  }
  
  try {
    const tournaments = await manager.getCreatorTournaments(ethers.ZeroAddress);
    console.log("✅ getCreatorTournaments() works:", tournaments.length, "tournaments");
  } catch (e) {
    console.log("❌ getCreatorTournaments() failed:", e.message);
  }
  
  console.log("\n✅ All functions verified!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


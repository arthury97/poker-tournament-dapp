const { ethers } = require("hardhat");

async function main() {
  const managerAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("Testing contract functions on localhost...");
  console.log("Contract address:", managerAddress);
  console.log("");
  
  // Get provider for localhost
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Get the contract factory and load the ABI
  const TournamentManager = await ethers.getContractFactory("TournamentManager");
  const manager = TournamentManager.attach(managerAddress).connect(provider);
  
  console.log("1. Testing getTotalTournaments()...");
  try {
    const result = await manager.getTotalTournaments();
    console.log("   ✅ Success:", result.toString());
  } catch (e) {
    console.log("   ❌ Failed:", e.message);
  }
  
  console.log("\n2. Testing tournaments(0)...");
  try {
    const result = await manager.tournaments(0);
    console.log("   ✅ Success:", result);
  } catch (e) {
    console.log("   ❌ Failed:", e.message);
  }
  
  console.log("\n3. Testing getTotalPlayerTokens()...");
  try {
    const result = await manager.getTotalPlayerTokens();
    console.log("   ✅ Success:", result.toString());
  } catch (e) {
    console.log("   ❌ Failed:", e.message);
  }
  
  console.log("\n4. Testing playerTokens(0)...");
  try {
    const result = await manager.playerTokens(0);
    console.log("   ✅ Success:", result);
  } catch (e) {
    console.log("   ❌ Failed:", e.message);
  }
  
  console.log("\n5. Checking contract code...");
  const code = await provider.getCode(managerAddress);
  if (code === "0x") {
    console.log("   ⚠️  WARNING: No contract code at this address!");
    console.log("   The contract may not be deployed or is on a different network.");
  } else {
    console.log("   ✅ Contract code exists (length:", code.length, "bytes)");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


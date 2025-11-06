const { ethers } = require("hardhat");

async function main() {
  const managerAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Get a test account (the first account from Hardhat node)
  const accounts = await provider.listAccounts();
  const testAccount = accounts[0];
  
  console.log("Testing Dashboard-related functions...");
  console.log("Contract address:", managerAddress);
  console.log("Test account:", testAccount);
  console.log("");
  
  const TournamentManager = await ethers.getContractFactory("TournamentManager");
  const manager = TournamentManager.attach(managerAddress).connect(provider);
  
  console.log("1. Testing getPlayerTokens(address)...");
  try {
    const result = await manager.getPlayerTokens(testAccount);
    console.log("   ✅ Success! Result:", result);
    console.log("   ✅ Array length:", result.length);
    if (result.length > 0) {
      console.log("   ✅ First token:", result[0]);
    }
  } catch (e) {
    console.log("   ❌ Failed:", e.message);
    console.log("   Error code:", e.code);
    console.log("   Error info:", e.info);
  }
  
  console.log("\n2. Testing getCreatorTournaments(address)...");
  try {
    const result = await manager.getCreatorTournaments(testAccount);
    console.log("   ✅ Success! Result:", result);
    console.log("   ✅ Array length:", result.length);
    if (result.length > 0) {
      console.log("   ✅ First token:", result[0]);
    }
  } catch (e) {
    console.log("   ❌ Failed:", e.message);
    console.log("   Error code:", e.code);
  }
  
  console.log("\n3. Checking contract code...");
  const code = await provider.getCode(managerAddress);
  if (code === "0x") {
    console.log("   ⚠️  WARNING: No contract code at this address!");
  } else {
    console.log("   ✅ Contract code exists (length:", code.length, "bytes)");
  }
  
  console.log("\n4. Testing with a contract interface (simulating frontend)...");
  try {
    // Simulate how the frontend creates the contract
    const testAbi = [
      "function getPlayerTokens(address player) external view returns (address[] memory)",
      "function getCreatorTournaments(address creator) external view returns (address[] memory)"
    ];
    const contract = new ethers.Contract(managerAddress, testAbi, provider);
    
    const result1 = await contract.getPlayerTokens(testAccount);
    console.log("   ✅ getPlayerTokens via ethers.Contract works! Length:", result1.length);
    
    const result2 = await contract.getCreatorTournaments(testAccount);
    console.log("   ✅ getCreatorTournaments via ethers.Contract works! Length:", result2.length);
  } catch (e) {
    console.log("   ❌ Failed:", e.message);
    console.log("   Error code:", e.code);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


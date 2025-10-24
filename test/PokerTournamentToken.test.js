const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PokerTournamentToken", function () {
  let pokerToken;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  const TOKEN_NAME = "Poker Tournament Token";
  const TOKEN_SYMBOL = "POKER";
  const BUY_IN_AMOUNT = ethers.utils.parseEther("1.0"); // 1 ETH
  const TOTAL_TOKENS = 1000;
  const PROFIT_SHARE_PERCENTAGE = 80; // 80%

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const PokerTournamentToken = await ethers.getContractFactory("PokerTournamentToken");
    pokerToken = await PokerTournamentToken.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      BUY_IN_AMOUNT,
      TOTAL_TOKENS,
      PROFIT_SHARE_PERCENTAGE
    );
    await pokerToken.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await pokerToken.owner()).to.equal(owner.address);
    });

    it("Should set the correct tournament info", async function () {
      const info = await pokerToken.getTournamentInfo();
      expect(info.name).to.equal(TOKEN_NAME);
      expect(info.buyInAmount).to.equal(BUY_IN_AMOUNT);
      expect(info.totalTokens).to.equal(TOTAL_TOKENS);
      expect(info.profitSharePercentage).to.equal(PROFIT_SHARE_PERCENTAGE);
      expect(info.tournamentCompleted).to.be.false;
    });

    it("Should mint all tokens to the contract", async function () {
      expect(await pokerToken.balanceOf(pokerToken.address)).to.equal(TOTAL_TOKENS);
    });
  });

  describe("Token Purchase", function () {
    it("Should allow users to purchase tokens", async function () {
      const tokenPrice = await pokerToken.getTokenPrice();
      const tokensToBuy = 100;
      const ethAmount = tokenPrice.mul(tokensToBuy);

      await expect(pokerToken.connect(addr1).purchaseTokens({ value: ethAmount }))
        .to.emit(pokerToken, "TokensPurchased")
        .withArgs(addr1.address, tokensToBuy, ethAmount);

      expect(await pokerToken.balanceOf(addr1.address)).to.equal(tokensToBuy);
    });

    it("Should refund excess ETH", async function () {
      const tokenPrice = await pokerToken.getTokenPrice();
      const tokensToBuy = 100;
      const ethAmount = tokenPrice.mul(tokensToBuy);
      const excessEth = ethers.utils.parseEther("0.1");

      const initialBalance = await addr1.getBalance();
      const tx = await pokerToken.connect(addr1).purchaseTokens({ 
        value: ethAmount.add(excessEth) 
      });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const finalBalance = await addr1.getBalance();

      expect(finalBalance).to.equal(initialBalance.sub(ethAmount).sub(gasUsed));
    });

    it("Should not allow purchase after tournament completion", async function () {
      await pokerToken.completeTournament(ethers.utils.parseEther("5.0"));
      
      const tokenPrice = await pokerToken.getTokenPrice();
      const ethAmount = tokenPrice.mul(100);

      await expect(
        pokerToken.connect(addr1).purchaseTokens({ value: ethAmount })
      ).to.be.revertedWith("Tournament already completed");
    });
  });

  describe("Tournament Management", function () {
    it("Should allow owner to withdraw for buy-in", async function () {
      // First, purchase some tokens to have ETH in contract
      const tokenPrice = await pokerToken.getTokenPrice();
      const ethAmount = tokenPrice.mul(100);
      await pokerToken.connect(addr1).purchaseTokens({ value: ethAmount });

      const initialBalance = await owner.getBalance();
      const tx = await pokerToken.withdrawForBuyIn();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const finalBalance = await owner.getBalance();

      expect(finalBalance).to.equal(initialBalance.add(ethAmount).sub(gasUsed));
    });

    it("Should allow owner to complete tournament", async function () {
      const winnings = ethers.utils.parseEther("5.0");
      
      await expect(pokerToken.completeTournament(winnings))
        .to.emit(pokerToken, "TournamentCompleted")
        .withArgs(winnings);

      const info = await pokerToken.getTournamentInfo();
      expect(info.tournamentCompleted).to.be.true;
      expect(info.totalWinnings).to.equal(winnings);
    });

    it("Should not allow non-owner to complete tournament", async function () {
      const winnings = ethers.utils.parseEther("5.0");
      
      await expect(
        pokerToken.connect(addr1).completeTournament(winnings)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Profit Distribution", function () {
    beforeEach(async function () {
      // Purchase tokens for multiple users
      const tokenPrice = await pokerToken.getTokenPrice();
      
      // addr1 buys 300 tokens
      await pokerToken.connect(addr1).purchaseTokens({ 
        value: tokenPrice.mul(300) 
      });
      
      // addr2 buys 200 tokens
      await pokerToken.connect(addr2).purchaseTokens({ 
        value: tokenPrice.mul(200) 
      });
      
      // addr3 buys 100 tokens
      await pokerToken.connect(addr3).purchaseTokens({ 
        value: tokenPrice.mul(100) 
      });

      // Owner withdraws for buy-in
      await pokerToken.withdrawForBuyIn();

      // Complete tournament with winnings
      const winnings = ethers.utils.parseEther("10.0");
      await pokerToken.completeTournament(winnings);
    });

    it("Should calculate correct potential winnings", async function () {
      // Total tokens sold: 600
      // addr1 has 300 tokens (50% of sold tokens)
      // Total winnings: 10 ETH
      // Profit share: 80%
      // Shareable winnings: 8 ETH
      // addr1's share: 4 ETH (50% of 8 ETH)

      const potentialWinnings = await pokerToken.getPotentialWinnings(addr1.address);
      expect(potentialWinnings).to.equal(ethers.utils.parseEther("4.0"));
    });

    it("Should allow users to claim winnings", async function () {
      // Send winnings to contract
      await owner.sendTransaction({
        to: pokerToken.address,
        value: ethers.utils.parseEther("10.0")
      });

      const initialBalance = await addr1.getBalance();
      const tx = await pokerToken.connect(addr1).claimWinnings();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const finalBalance = await addr1.getBalance();

      expect(finalBalance).to.equal(initialBalance.add(ethers.utils.parseEther("4.0")).sub(gasUsed));
    });

    it("Should not allow double claiming", async function () {
      // Send winnings to contract
      await owner.sendTransaction({
        to: pokerToken.address,
        value: ethers.utils.parseEther("10.0")
      });

      await pokerToken.connect(addr1).claimWinnings();
      
      await expect(
        pokerToken.connect(addr1).claimWinnings()
      ).to.be.revertedWith("Already claimed winnings");
    });
  });

  describe("Profit Share Update", function () {
    it("Should allow owner to update profit share", async function () {
      const newPercentage = 70;
      
      await expect(pokerToken.updateProfitShare(newPercentage))
        .to.emit(pokerToken, "ProfitShareUpdated")
        .withArgs(newPercentage);

      const info = await pokerToken.getTournamentInfo();
      expect(info.profitSharePercentage).to.equal(newPercentage);
    });

    it("Should not allow profit share > 100%", async function () {
      await expect(
        pokerToken.updateProfitShare(101)
      ).to.be.revertedWith("Profit share cannot exceed 100%");
    });

    it("Should not allow update after tournament completion", async function () {
      await pokerToken.completeTournament(ethers.utils.parseEther("5.0"));
      
      await expect(
        pokerToken.updateProfitShare(70)
      ).to.be.revertedWith("Cannot update after tournament completion");
    });
  });
});

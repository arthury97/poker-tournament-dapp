const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TournamentManager", function () {
  let tournamentManager;
  let pokerToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const TournamentManager = await ethers.getContractFactory("TournamentManager");
    tournamentManager = await TournamentManager.deploy();
    await tournamentManager.deployed();
  });

  describe("Tournament Creation", function () {
    it("Should create a new tournament", async function () {
      const tx = await tournamentManager.connect(addr1).createTournament(
        "Test Tournament",
        "TEST",
        ethers.utils.parseEther("1.0"),
        1000,
        80
      );

      await expect(tx)
        .to.emit(tournamentManager, "TournamentCreated")
        .withArgs(
          await tournamentManager.tournaments(0),
          addr1.address,
          "Test Tournament",
          ethers.utils.parseEther("1.0"),
          1000,
          80
        );

      const tournamentAddress = await tournamentManager.tournaments(0);
      expect(tournamentAddress).to.not.equal(ethers.constants.AddressZero);
      expect(await tournamentManager.isActiveTournament(tournamentAddress)).to.be.true;
    });

    it("Should track creator's tournaments", async function () {
      await tournamentManager.connect(addr1).createTournament(
        "Tournament 1",
        "T1",
        ethers.utils.parseEther("1.0"),
        1000,
        80
      );

      await tournamentManager.connect(addr1).createTournament(
        "Tournament 2",
        "T2",
        ethers.utils.parseEther("2.0"),
        2000,
        70
      );

      const creatorTournaments = await tournamentManager.getCreatorTournaments(addr1.address);
      expect(creatorTournaments.length).to.equal(2);
    });

    it("Should set correct ownership of created tournament", async function () {
      await tournamentManager.connect(addr1).createTournament(
        "Test Tournament",
        "TEST",
        ethers.utils.parseEther("1.0"),
        1000,
        80
      );

      const tournamentAddress = await tournamentManager.tournaments(0);
      const PokerTournamentToken = await ethers.getContractFactory("PokerTournamentToken");
      const tournament = PokerTournamentToken.attach(tournamentAddress);
      
      expect(await tournament.owner()).to.equal(addr1.address);
    });

    it("Should reject invalid parameters", async function () {
      await expect(
        tournamentManager.connect(addr1).createTournament(
          "Test Tournament",
          "TEST",
          ethers.utils.parseEther("1.0"),
          0, // Invalid: 0 tokens
          80
        )
      ).to.be.revertedWith("Total tokens must be greater than 0");

      await expect(
        tournamentManager.connect(addr1).createTournament(
          "Test Tournament",
          "TEST",
          ethers.utils.parseEther("1.0"),
          1000,
          101 // Invalid: > 100%
        )
      ).to.be.revertedWith("Profit share cannot exceed 100%");

      await expect(
        tournamentManager.connect(addr1).createTournament(
          "Test Tournament",
          "TEST",
          0, // Invalid: 0 buy-in
          1000,
          80
        )
      ).to.be.revertedWith("Buy-in amount must be greater than 0");
    });
  });

  describe("Tournament Management", function () {
    let tournamentAddress;

    beforeEach(async function () {
      await tournamentManager.connect(addr1).createTournament(
        "Test Tournament",
        "TEST",
        ethers.utils.parseEther("1.0"),
        1000,
        80
      );
      tournamentAddress = await tournamentManager.tournaments(0);
    });

    it("Should get total tournaments count", async function () {
      expect(await tournamentManager.getTotalTournaments()).to.equal(1);
    });

    it("Should get tournament at index", async function () {
      const tournament = await tournamentManager.getTournament(0);
      expect(tournament).to.equal(tournamentAddress);
    });

    it("Should get active tournaments", async function () {
      const activeTournaments = await tournamentManager.getActiveTournaments();
      expect(activeTournaments.length).to.equal(1);
      expect(activeTournaments[0]).to.equal(tournamentAddress);
    });

    it("Should get tournament details", async function () {
      const details = await tournamentManager.getTournamentDetails(tournamentAddress);
      expect(details.name).to.equal("Test Tournament");
      expect(details.buyInAmount).to.equal(ethers.utils.parseEther("1.0"));
      expect(details.totalTokens).to.equal(1000);
      expect(details.tournamentOwner).to.equal(addr1.address);
    });

    it("Should allow tournament owner to deactivate", async function () {
      await tournamentManager.connect(addr1).deactivateTournament(tournamentAddress);
      expect(await tournamentManager.isActiveTournament(tournamentAddress)).to.be.false;
    });

    it("Should allow contract owner to deactivate any tournament", async function () {
      await tournamentManager.deactivateTournament(tournamentAddress);
      expect(await tournamentManager.isActiveTournament(tournamentAddress)).to.be.false;
    });

    it("Should not allow unauthorized deactivation", async function () {
      await expect(
        tournamentManager.connect(addr2).deactivateTournament(tournamentAddress)
      ).to.be.revertedWith("Not authorized to deactivate this tournament");
    });
  });

  describe("Emergency Functions", function () {
    beforeEach(async function () {
      // Create multiple tournaments
      await tournamentManager.connect(addr1).createTournament(
        "Tournament 1",
        "T1",
        ethers.utils.parseEther("1.0"),
        1000,
        80
      );

      await tournamentManager.connect(addr2).createTournament(
        "Tournament 2",
        "T2",
        ethers.utils.parseEther("2.0"),
        2000,
        70
      );
    });

    it("Should allow owner to emergency deactivate all tournaments", async function () {
      const tournament1 = await tournamentManager.tournaments(0);
      const tournament2 = await tournamentManager.tournaments(1);

      expect(await tournamentManager.isActiveTournament(tournament1)).to.be.true;
      expect(await tournamentManager.isActiveTournament(tournament2)).to.be.true;

      await tournamentManager.emergencyDeactivateAll();

      expect(await tournamentManager.isActiveTournament(tournament1)).to.be.false;
      expect(await tournamentManager.isActiveTournament(tournament2)).to.be.false;
    });

    it("Should not allow non-owner to emergency deactivate", async function () {
      await expect(
        tournamentManager.connect(addr1).emergencyDeactivateAll()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});

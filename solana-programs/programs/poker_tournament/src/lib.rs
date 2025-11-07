use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod poker_tournament {
    use super::*;

    /// Initialize a new tournament token
    /// This is equivalent to Ethereum's TournamentManager.createPlayerToken()
    pub fn create_tournament(
        ctx: Context<CreateTournament>,
        player_name: String,
        token_symbol: String,
        buy_in_amount: u64,      // In lamports (SOL)
        total_tokens: u64,
        profit_share_percentage: u8,
    ) -> Result<()> {
        require!(profit_share_percentage <= 100, TournamentError::InvalidProfitShare);
        require!(total_tokens > 0, TournamentError::InvalidTotalTokens);
        require!(buy_in_amount > 0, TournamentError::InvalidBuyIn);
        require!(total_tokens <= 1_000_000, TournamentError::ExceedsMaxTokens);
        
        let tournament = &mut ctx.accounts.tournament;
        tournament.authority = ctx.accounts.authority.key();
        tournament.player_name = player_name;
        tournament.token_symbol = token_symbol;
        tournament.buy_in_amount = buy_in_amount;
        tournament.total_tokens = total_tokens;
        tournament.tokens_sold = 0;
        tournament.profit_share_percentage = profit_share_percentage;
        tournament.tournament_completed = false;
        tournament.total_winnings = 0;
        tournament.winnings_distributed = false;
        tournament.is_active = true;
        tournament.token_mint = ctx.accounts.token_mint.key();
        tournament.buyer_count = 0;
        tournament.bump = ctx.bumps.tournament;

        emit!(TournamentCreated {
            tournament: tournament.key(),
            authority: tournament.authority,
            player_name: tournament.player_name.clone(),
            buy_in_amount,
            total_tokens,
        });

        Ok(())
    }

    /// Purchase tournament tokens
    /// Equivalent to Ethereum's PokerTournamentToken.purchaseTokens()
    pub fn purchase_tokens(
        ctx: Context<PurchaseTokens>,
        token_amount: u64,
    ) -> Result<()> {
        let tournament = &mut ctx.accounts.tournament;
        
        require!(tournament.is_active, TournamentError::TournamentInactive);
        require!(!tournament.tournament_completed, TournamentError::TournamentCompleted);
        require!(tournament.tokens_sold < tournament.total_tokens, TournamentError::AllTokensSold);
        require!(ctx.accounts.buyer.key() != tournament.authority, TournamentError::CreatorCannotPurchase);
        require!(token_amount > 0, TournamentError::InvalidAmount);
        
        // Maximum tokens per transaction (anti-griefing)
        require!(token_amount <= 10_000, TournamentError::ExceedsMaxPerTransaction);
        
        // Calculate cost in lamports
        let cost_in_lamports = (token_amount as u128)
            .checked_mul(tournament.buy_in_amount as u128)
            .unwrap()
            .checked_div(tournament.total_tokens as u128)
            .unwrap() as u64;
        
        // Transfer SOL from buyer to tournament vault
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &ctx.accounts.tournament_vault.key(),
            cost_in_lamports,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.tournament_vault.to_account_info(),
            ],
        )?;
        
        // Transfer SPL tokens to buyer
        let seeds = &[
            b"tournament",
            tournament.authority.as_ref(),
            &[tournament.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.token_vault.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: ctx.accounts.tournament.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, token_amount)?;
        
        // Update tournament state
        tournament.tokens_sold += token_amount;
        
        // Track buyer for refunds
        let buyer_data = &mut ctx.accounts.buyer_data;
        if buyer_data.purchase_amount == 0 {
            // First purchase from this buyer
            tournament.buyer_count += 1;
        }
        buyer_data.buyer = ctx.accounts.buyer.key();
        buyer_data.tournament = tournament.key();
        buyer_data.purchase_amount += cost_in_lamports;
        buyer_data.tokens_owned += token_amount;
        buyer_data.bump = ctx.bumps.buyer_data;
        
        emit!(TokensPurchased {
            buyer: ctx.accounts.buyer.key(),
            tournament: tournament.key(),
            amount: token_amount,
            cost: cost_in_lamports,
        });
        
        Ok(())
    }

    /// Deactivate and refund tournament
    /// Equivalent to Ethereum's TournamentManager.deactivatePlayerToken() + refundAllBuyers()
    pub fn deactivate_and_refund(
        ctx: Context<DeactivateTournament>,
    ) -> Result<()> {
        let tournament = &mut ctx.accounts.tournament;
        
        require!(ctx.accounts.authority.key() == tournament.authority, TournamentError::Unauthorized);
        require!(tournament.is_active, TournamentError::TournamentInactive);
        require!(!tournament.tournament_completed, TournamentError::TournamentCompleted);
        
        // Mark as inactive
        tournament.is_active = false;
        
        emit!(TournamentDeactivated {
            tournament: tournament.key(),
            authority: ctx.accounts.authority.key(),
        });
        
        Ok(())
    }

    /// Process refund for a single buyer
    /// Called repeatedly for each buyer after tournament deactivation
    pub fn process_buyer_refund(
        ctx: Context<ProcessBuyerRefund>,
    ) -> Result<()> {
        let tournament = &ctx.accounts.tournament;
        let buyer_data = &mut ctx.accounts.buyer_data;
        
        require!(!tournament.is_active, TournamentError::TournamentActive);
        require!(buyer_data.purchase_amount > 0, TournamentError::NoPurchase);
        require!(!buyer_data.refunded, TournamentError::AlreadyRefunded);
        
        // Calculate refund (97%, 3% service fee)
        let service_fee_percentage = 3u64;
        let service_fee = buyer_data.purchase_amount
            .checked_mul(service_fee_percentage)
            .unwrap()
            .checked_div(100)
            .unwrap();
        let refund_amount = buyer_data.purchase_amount.checked_sub(service_fee).unwrap();
        
        // Transfer refund from tournament vault to buyer
        let seeds = &[
            b"vault",
            tournament.key().as_ref(),
            &[ctx.bumps.tournament_vault],
        ];
        let signer = &[&seeds[..]];
        
        **ctx.accounts.tournament_vault.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? += refund_amount;
        
        // Mark as refunded
        buyer_data.refunded = true;
        
        emit!(BuyerRefunded {
            buyer: buyer_data.buyer,
            tournament: tournament.key(),
            amount: refund_amount,
        });
        
        Ok(())
    }

    /// Complete tournament and set winnings
    /// Equivalent to Ethereum's PokerTournamentToken.completeTournament()
    pub fn complete_tournament(
        ctx: Context<CompleteTournament>,
        total_winnings: u64,
    ) -> Result<()> {
        let tournament = &mut ctx.accounts.tournament;
        
        require!(ctx.accounts.authority.key() == tournament.authority, TournamentError::Unauthorized);
        require!(!tournament.tournament_completed, TournamentError::TournamentCompleted);
        require!(total_winnings > 0, TournamentError::InvalidWinnings);
        
        // Validate winnings don't exceed maximum
        let max_winnings = tournament.buy_in_amount.checked_mul(1000).unwrap();
        require!(total_winnings <= max_winnings, TournamentError::ExceedsMaxWinnings);
        
        tournament.tournament_completed = true;
        tournament.total_winnings = total_winnings;
        
        emit!(TournamentCompleted {
            tournament: tournament.key(),
            total_winnings,
        });
        
        Ok(())
    }

    /// Claim winnings for a token holder
    /// Equivalent to Ethereum's PokerTournamentToken.claimWinnings()
    pub fn claim_winnings(
        ctx: Context<ClaimWinnings>,
    ) -> Result<()> {
        let tournament = &ctx.accounts.tournament;
        let buyer_data = &mut ctx.accounts.buyer_data;
        
        require!(tournament.tournament_completed, TournamentError::TournamentNotCompleted);
        require!(!buyer_data.winnings_claimed, TournamentError::AlreadyClaimed);
        require!(buyer_data.tokens_owned > 0, TournamentError::NoTokens);
        
        // Calculate claimable winnings
        let share_amount = (tournament.total_winnings as u128)
            .checked_mul(tournament.profit_share_percentage as u128)
            .unwrap()
            .checked_div(100)
            .unwrap();
        
        let user_share = (share_amount as u128)
            .checked_mul(buyer_data.tokens_owned as u128)
            .unwrap()
            .checked_div(tournament.tokens_sold as u128)
            .unwrap() as u64;
        
        require!(user_share > 0, TournamentError::NoWinnings);
        
        // Transfer winnings from vault to user
        let seeds = &[
            b"vault",
            tournament.key().as_ref(),
            &[ctx.bumps.tournament_vault],
        ];
        let signer = &[&seeds[..]];
        
        **ctx.accounts.tournament_vault.to_account_info().try_borrow_mut_lamports()? -= user_share;
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? += user_share;
        
        buyer_data.winnings_claimed = true;
        
        emit!(WinningsClaimed {
            buyer: buyer_data.buyer,
            tournament: tournament.key(),
            amount: user_share,
        });
        
        Ok(())
    }
}

// ============================================================================
// State Structs
// ============================================================================

#[account]
pub struct Tournament {
    pub authority: Pubkey,           // Tournament creator (player)
    pub player_name: String,         // Player name (max 100 chars)
    pub token_symbol: String,        // Token symbol (max 10 chars)
    pub buy_in_amount: u64,          // Buy-in in lamports
    pub total_tokens: u64,           // Total tokens minted
    pub tokens_sold: u64,            // Tokens sold so far
    pub profit_share_percentage: u8, // Percentage of winnings to share
    pub tournament_completed: bool,  // Whether tournament is finished
    pub total_winnings: u64,         // Total winnings in lamports
    pub winnings_distributed: bool,  // Whether winnings have been distributed
    pub is_active: bool,             // Whether tournament is active (not deleted)
    pub token_mint: Pubkey,          // SPL token mint address
    pub buyer_count: u32,            // Number of unique buyers
    pub bump: u8,                    // PDA bump seed
}

#[account]
pub struct BuyerData {
    pub buyer: Pubkey,           // Buyer's wallet address
    pub tournament: Pubkey,      // Tournament this purchase is for
    pub purchase_amount: u64,    // Total lamports spent
    pub tokens_owned: u64,       // Total tokens owned
    pub refunded: bool,          // Whether buyer was refunded
    pub winnings_claimed: bool,  // Whether winnings were claimed
    pub bump: u8,                // PDA bump seed
}

// ============================================================================
// Context Structs (Accounts for each instruction)
// ============================================================================

#[derive(Accounts)]
#[instruction(player_name: String, token_symbol: String)]
pub struct CreateTournament<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 104 + 14 + 8 + 8 + 8 + 1 + 1 + 8 + 1 + 1 + 32 + 4 + 1,
        seeds = [b"tournament", authority.key().as_ref()],
        bump
    )]
    pub tournament: Account<'info, Tournament>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = tournament,
    )]
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = tournament,
    )]
    pub token_vault: Account<'info, TokenAccount>,
    
    /// CHECK: Tournament vault for SOL
    #[account(
        mut,
        seeds = [b"vault", tournament.key().as_ref()],
        bump
    )]
    pub tournament_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct PurchaseTokens<'info> {
    #[account(mut)]
    pub tournament: Account<'info, Tournament>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + 32 + 32 + 8 + 8 + 1 + 1 + 1,
        seeds = [b"buyer", tournament.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub buyer_data: Account<'info, BuyerData>,
    
    #[account(
        mut,
        token::mint = tournament.token_mint,
        token::authority = tournament,
    )]
    pub token_vault: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        token::mint = tournament.token_mint,
        token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Tournament vault for SOL
    #[account(
        mut,
        seeds = [b"vault", tournament.key().as_ref()],
        bump
    )]
    pub tournament_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DeactivateTournament<'info> {
    #[account(mut)]
    pub tournament: Account<'info, Tournament>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ProcessBuyerRefund<'info> {
    #[account(mut)]
    pub tournament: Account<'info, Tournament>,
    
    #[account(
        mut,
        seeds = [b"buyer", tournament.key().as_ref(), buyer_data.buyer.as_ref()],
        bump = buyer_data.bump
    )]
    pub buyer_data: Account<'info, BuyerData>,
    
    /// CHECK: Tournament vault for SOL
    #[account(
        mut,
        seeds = [b"vault", tournament.key().as_ref()],
        bump
    )]
    pub tournament_vault: AccountInfo<'info>,
    
    /// CHECK: Buyer receiving refund
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteTournament<'info> {
    #[account(mut)]
    pub tournament: Account<'info, Tournament>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub tournament: Account<'info, Tournament>,
    
    #[account(
        mut,
        seeds = [b"buyer", tournament.key().as_ref(), buyer.key().as_ref()],
        bump = buyer_data.bump
    )]
    pub buyer_data: Account<'info, BuyerData>,
    
    /// CHECK: Tournament vault for SOL
    #[account(
        mut,
        seeds = [b"vault", tournament.key().as_ref()],
        bump
    )]
    pub tournament_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct TournamentCreated {
    pub tournament: Pubkey,
    pub authority: Pubkey,
    pub player_name: String,
    pub buy_in_amount: u64,
    pub total_tokens: u64,
}

#[event]
pub struct TokensPurchased {
    pub buyer: Pubkey,
    pub tournament: Pubkey,
    pub amount: u64,
    pub cost: u64,
}

#[event]
pub struct TournamentDeactivated {
    pub tournament: Pubkey,
    pub authority: Pubkey,
}

#[event]
pub struct BuyerRefunded {
    pub buyer: Pubkey,
    pub tournament: Pubkey,
    pub amount: u64,
}

#[event]
pub struct TournamentCompleted {
    pub tournament: Pubkey,
    pub total_winnings: u64,
}

#[event]
pub struct WinningsClaimed {
    pub buyer: Pubkey,
    pub tournament: Pubkey,
    pub amount: u64,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum TournamentError {
    #[msg("Invalid profit share percentage")]
    InvalidProfitShare,
    #[msg("Invalid total tokens amount")]
    InvalidTotalTokens,
    #[msg("Invalid buy-in amount")]
    InvalidBuyIn,
    #[msg("Exceeds maximum tokens allowed")]
    ExceedsMaxTokens,
    #[msg("Tournament is inactive")]
    TournamentInactive,
    #[msg("Tournament already completed")]
    TournamentCompleted,
    #[msg("All tokens have been sold")]
    AllTokensSold,
    #[msg("Token creator cannot purchase their own tokens")]
    CreatorCannotPurchase,
    #[msg("Invalid token amount")]
    InvalidAmount,
    #[msg("Exceeds maximum tokens per transaction")]
    ExceedsMaxPerTransaction,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Tournament is still active")]
    TournamentActive,
    #[msg("No purchase found")]
    NoPurchase,
    #[msg("Already refunded")]
    AlreadyRefunded,
    #[msg("Invalid winnings amount")]
    InvalidWinnings,
    #[msg("Exceeds maximum allowed winnings")]
    ExceedsMaxWinnings,
    #[msg("Tournament not completed yet")]
    TournamentNotCompleted,
    #[msg("Winnings already claimed")]
    AlreadyClaimed,
    #[msg("No tokens owned")]
    NoTokens,
    #[msg("No winnings available")]
    NoWinnings,
}


use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use switchboard_solana::AggregatorAccountData;

use crate::constants::*;
use crate::error::*;
use crate::Escrow;

#[derive(Accounts)]
#[instruction(escrow_seed:String)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [escrow_seed.as_bytes(), user.key().as_ref()],
        bump,
        close = user,
    )]
    pub escrow_account: Account<'info, Escrow>,

    #[account(
        address = SOL_USDC_FEED,
    )]
    pub feed_aggregator: AccountLoader<'info, AggregatorAccountData>,

    pub system_proram: Program<'info, System>,
}

pub fn withdraw_handler(ctx: Context<Withdraw>, _escrow_seed: String) -> Result<()> {
    let feed = &ctx.accounts.feed_aggregator.load_mut()?;
    let escrow = &ctx.accounts.escrow_account;

    let current_sol_price: f64 = feed.get_result()?.try_into()?;

    //Check if the feed has been updated in the last 5 minutes
    let _ = feed
        .check_staleness(Clock::get().unwrap().unix_timestamp, 300)
        .map_err(|_| error!(EscrowErrorCode::StaleFeed));

    msg!("Current SOL price is {}", current_sol_price);
    msg!("Unlock pricd is {}", escrow.unlock_price);

    if current_sol_price < escrow.unlock_price {
        return Err(EscrowErrorCode::SolPriceBelowUnlockPrice.into());
    }

    let escrow_lamports = escrow.escrow_amount;

    //we can use system_program::transfer method to transfer from an account which holds data
    **escrow.to_account_info().try_borrow_mut_lamports()? = escrow
        .to_account_info()
        .lamports()
        .checked_sub(escrow_lamports)
        .ok_or(ProgramError::InsufficientFunds)?;

    **ctx
        .accounts
        .user
        .to_account_info()
        .try_borrow_mut_lamports()? = ctx
        .accounts
        .user
        .to_account_info()
        .lamports()
        .checked_add(escrow_lamports)
        .ok_or(ProgramError::InvalidArgument)?;

    Ok(())
}

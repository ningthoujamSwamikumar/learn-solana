use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction::transfer;

use crate::constants;
use crate::state;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        seeds = [constants::ESCROW_SEED, user.key().as_ref()],
        bump,
        payer = user,
        space = constants::DISCRIMINATOR_SIZE + state::Escrow::INIT_SPACE,
    )]
    pub escrow_account: Account<'info, state::Escrow>,

    pub system_program: Program<'info, System>,
}

pub fn deposit_handler(ctx: Context<Deposit>, escrow_amount: u64, unlock_price: f64) -> Result<()> {
    msg!("Depositing funds in escrow...");

    let escrow = &mut ctx.accounts.escrow_account;
    escrow.unlock_price = unlock_price;
    escrow.escrow_amount = escrow_amount;

    let transfer_instruction = transfer(&ctx.accounts.user.key(), &escrow.key(), escrow_amount);

    invoke(
        &transfer_instruction,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.escrow_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    msg!(
        "Transfer complete. Escrow will unlock SOL at {}",
        &ctx.accounts.escrow_account.unlock_price
    );

    Ok(())
}

use pinocchio::{
    account_info::AccountInfo,
    instruction::{Seed, Signer},
    program_error::ProgramError,
    pubkey::find_program_address,
    ProgramResult,
};
use pinocchio_token::state::TokenAccount;

use crate::{
    AccountCheck, AccountClose, AssociatedTokenAccount, AssociatedTokenAccountCheck,
    AssociatedTokenAccountInit, Escrow, MintInterface, ProgramAccount, ProgramAccountCheck,
    SignerAccount,
};

pub struct RefundAccounts<'a> {
    pub maker: &'a AccountInfo,
    pub escrow: &'a AccountInfo,
    pub mint_a: &'a AccountInfo,
    pub vault: &'a AccountInfo,
    pub maker_ata_a: &'a AccountInfo,
    pub system_program: &'a AccountInfo,
    pub token_program: &'a AccountInfo,
    pub associated_token_program: &'a AccountInfo,
}

impl<'a> TryFrom<&'a [AccountInfo]> for RefundAccounts<'a> {
    type Error = ProgramError;

    fn try_from(accounts: &'a [AccountInfo]) -> Result<Self, Self::Error> {
        let [maker, escrow, mint_a, vault, maker_ata_a, system_program, token_program, associated_token_program] =
            accounts
        else {
            return Err(ProgramError::NotEnoughAccountKeys);
        };

        //account checks
        SignerAccount::check(maker)?;
        ProgramAccount::check::<Escrow>(escrow)?;
        MintInterface::check(mint_a)?;

        //not sure this is exist, so better be done init_if_needed, instead of checking account here which could give us error
        //AssociatedTokenAccount::check(maker_ata_a, maker, mint_a, token_program)?;
        AssociatedTokenAccount::check(vault, escrow, mint_a, token_program)?;

        let data = escrow.try_borrow_data()?;
        let escrow_data = Escrow::load(&data)?;
        let escrow_key = find_program_address(
            &[
                b"escrow",
                maker.key().as_ref(),
                &escrow_data.seed.to_le_bytes(),
            ],
            &crate::ID,
        )
        .0;
        if &escrow_key != escrow.key() {
            return Err(ProgramError::InvalidAccountData);
        }
        if system_program.key() != &pinocchio_system::ID {
            return Err(ProgramError::InvalidAccountOwner);
        }

        Ok(Self {
            maker,
            maker_ata_a,
            escrow,
            vault,
            mint_a,
            system_program,
            token_program,
            associated_token_program,
        })
    }
}

pub struct RefundInstructionData {}

pub struct Refund<'a> {
    pub accounts: RefundAccounts<'a>,
}

impl<'a> TryFrom<&'a [AccountInfo]> for Refund<'a> {
    type Error = ProgramError;

    fn try_from(accounts: &'a [AccountInfo]) -> Result<Self, Self::Error> {
        let accounts = RefundAccounts::try_from(accounts)?;

        AssociatedTokenAccount::init_if_needed(
            accounts.maker_ata_a,
            accounts.mint_a,
            accounts.maker,
            accounts.maker,
            accounts.system_program,
            accounts.token_program,
        )?;

        Ok(Self { accounts })
    }
}

impl<'a> Refund<'a> {
    pub const DISCRIMINATOR: &'a u8 = &2;

    pub fn process(&mut self) -> ProgramResult {
        //transfer token from vault to maker_ata
        let escrow_data = self.accounts.escrow.try_borrow_data()?;
        let escrow = Escrow::load(&escrow_data)?;
        let seed_binding = escrow.seed.to_le_bytes();
        let signer_seeds = [
            Seed::from(b"escrow"),
            Seed::from(self.accounts.maker.key().as_ref()),
            Seed::from(&seed_binding),
            Seed::from(&escrow.bump),
        ];
        let signer = Signer::from(&signer_seeds);

        let amount = TokenAccount::from_account_info(self.accounts.vault)?.amount();

        pinocchio_token::instructions::Transfer {
            amount,
            authority: self.accounts.escrow,
            from: self.accounts.vault,
            to: self.accounts.maker_ata_a,
        }
        .invoke_signed(&[signer.clone()])?;

        //close vault
        pinocchio_token::instructions::CloseAccount {
            account: self.accounts.vault,
            authority: self.accounts.escrow,
            destination: self.accounts.maker,
        }
        .invoke_signed(&[signer])?;

        drop(escrow_data); //becuase this data is going to be borrowed mutably in close function
                           //close escrow
        ProgramAccount::close(self.accounts.escrow, self.accounts.maker)
    }
}

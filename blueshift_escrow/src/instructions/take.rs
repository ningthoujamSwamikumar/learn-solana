use pinocchio::{
    account_info::AccountInfo,
    instruction::{Seed, Signer},
    program_error::ProgramError,
    pubkey::find_program_address,
    ProgramResult,
};
use pinocchio_token::state::TokenAccount;

use crate::{
    AccountCheck, AccountClose, AccountError, AssociatedTokenAccount, AssociatedTokenAccountCheck,
    AssociatedTokenAccountInit, Escrow, MintInterface, ProgramAccount, ProgramAccountCheck,
    SignerAccount,
};

pub struct TakeAccounts<'a> {
    pub taker: &'a AccountInfo,
    pub taker_ata_b: &'a AccountInfo,
    pub taker_ata_a: &'a AccountInfo,
    pub vault: &'a AccountInfo,
    pub escrow: &'a AccountInfo,
    pub mint_a: &'a AccountInfo,
    pub mint_b: &'a AccountInfo,
    pub maker: &'a AccountInfo,
    pub maker_ata_b: &'a AccountInfo,
    pub system_program: &'a AccountInfo,
    pub token_program: &'a AccountInfo,
}

impl<'a> TryFrom<&'a [AccountInfo]> for TakeAccounts<'a> {
    type Error = ProgramError;

    fn try_from(accounts: &'a [AccountInfo]) -> Result<Self, Self::Error> {
        let [taker, taker_ata_a, taker_ata_b, vault, escrow, mint_a, mint_b, maker, maker_ata_b, system_program, token_program] =
            accounts
        else {
            return Err(ProgramError::NotEnoughAccountKeys);
        };

        //Basic Accounts Checks
        SignerAccount::check(taker)?;
        ProgramAccount::check::<Escrow>(escrow)?;
        MintInterface::check(mint_a)?;
        MintInterface::check(mint_b)?;
        AssociatedTokenAccount::check(taker_ata_b, taker, mint_b, token_program)?;
        AssociatedTokenAccount::check(vault, escrow, mint_a, token_program)?;
        //mint_a token accounts aren't checked coz we'll probably have to initialized them

        Ok(Self {
            taker,
            taker_ata_b,
            taker_ata_a,
            vault,
            escrow,
            mint_a,
            mint_b,
            maker,
            maker_ata_b,
            system_program,
            token_program,
        })
    }
}

pub struct TakeInstructionData {
    //all the data we need to perform the logic already lives in the Escrow acount or on the accounts that we're deserializing.
}

pub struct Take<'a> {
    pub accounts: TakeAccounts<'a>,
}

impl<'a> TryFrom<&'a [AccountInfo]> for Take<'a> {
    type Error = ProgramError;

    fn try_from(accounts: &'a [AccountInfo]) -> Result<Self, Self::Error> {
        let accounts = TakeAccounts::try_from(accounts)?;

        //Initialized necessary accounts
        AssociatedTokenAccount::init_if_needed(
            accounts.taker_ata_a,
            accounts.mint_a,
            accounts.taker,
            accounts.taker,
            accounts.system_program,
            accounts.token_program,
        )?;

        AssociatedTokenAccount::init_if_needed(
            accounts.maker_ata_b,
            accounts.mint_b,
            accounts.taker,
            accounts.maker,
            accounts.system_program,
            accounts.token_program,
        )?;

        Ok(Self { accounts })
    }
}

impl<'a> Take<'a> {
    pub const DISCRIMINATOR: &'a u8 = &1;

    pub fn process(&mut self) -> ProgramResult {
        let data = self.accounts.escrow.try_borrow_data()?;
        let escrow = Escrow::load(&data)?;

        //validate escrow
        let escrow_key = find_program_address(
            &[
                b"escrow",
                self.accounts.maker.key().as_ref(),
                &escrow.seed.to_le_bytes(),
                &escrow.bump,
            ],
            &crate::ID,
        )
        .0;
        if self.accounts.escrow.key() != &escrow_key {
            return Err(ProgramError::InvalidAccountOwner);
        }

        let seed_binding = escrow.seed.to_le_bytes();
        let bump_binding = escrow.bump;
        let escrow_seeds = [
            Seed::from(b"escrow"),
            Seed::from(self.accounts.maker.key().as_ref()),
            Seed::from(&seed_binding),
            Seed::from(&bump_binding),
        ];
        let signer = Signer::from(&escrow_seeds);

        let amount = TokenAccount::from_account_info(self.accounts.vault)?.amount();

        //transfer vault token-a to taker
        pinocchio_token::instructions::Transfer {
            amount,
            authority: self.accounts.escrow,
            from: self.accounts.vault,
            to: self.accounts.taker_ata_a,
        }
        .invoke_signed(&[signer.clone()])?;

        //transfer token b from taker to maker
        pinocchio_token::instructions::Transfer {
            amount: escrow.receive,
            authority: self.accounts.taker,
            from: self.accounts.taker_ata_b,
            to: self.accounts.maker_ata_b,
        }
        .invoke()?;

        //close vault account
        pinocchio_token::instructions::CloseAccount {
            account: self.accounts.vault,
            authority: self.accounts.escrow,
            destination: self.accounts.maker,
        }
        .invoke_signed(&[signer]);

        //close escrow account
        ProgramAccount::close(self.accounts.escrow, self.accounts.maker)
    }
}

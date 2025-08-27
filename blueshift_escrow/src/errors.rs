use pinocchio::program_error::ProgramError;

//#[repr(u32)]
pub enum AccountError {
    NotSigner,
    InvalidAddress,
}

impl From<AccountError> for ProgramError {
    fn from(err: AccountError) -> Self {
        ProgramError::Custom(err as u32)
    }
}

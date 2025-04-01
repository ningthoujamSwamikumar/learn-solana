use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

declare_id!("C8EzzeRhuashu7y9JsLA36z8V4mXoJ5SGAR6Zieae8y6");

const MIN_RATING: u8 = 1;
const MAX_RATING: u8 = 5;
const MAX_TITLE_LENGTH: usize = 20;
const MAX_DESCRIPTION_LENGTH: usize = 50;

#[program]
pub mod anchor_movie_review_program {
    use anchor_spl::token::{mint_to, MintTo};

    use super::*;

    pub fn add_movie_review(
        ctx: Context<AddMovieReview>,
        title: String,
        description: String,
        rating: u8,
    ) -> Result<()> {
        //we require that the rating is between 1 and 5
        require!(
            rating >= MIN_RATING && rating <= MAX_RATING,
            MovieReviewError::InvalidRating
        );

        //we require that the title is not longer than 20 characters
        require!(
            title.len() <= MAX_TITLE_LENGTH,
            MovieReviewError::TitleTooLong
        );

        //we require that the description is not longer than 50 characters
        require!(
            description.len() <= MAX_DESCRIPTION_LENGTH,
            MovieReviewError::DescriptionTooLong
        );

        msg!("Movie Review Account Created");
        msg!("Title: {}", title);
        msg!("Description: {}", description);
        msg!("Rating: {}", rating);

        let movie_review = &mut ctx.accounts.movie_review;
        movie_review.reviewer = ctx.accounts.initializer.key();
        movie_review.title = title;
        movie_review.rating = rating;
        movie_review.description = description;

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    authority: ctx.accounts.initializer.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                },
                &[&[b"mint", &[ctx.bumps.mint]]],
            ),
            10 * 10u64.pow(6),
        )?;

        msg!("Minted tokens");

        Ok(())
    }

    pub fn update_movie_review(
        ctx: Context<UpdateMovieReview>,
        title: String,
        description: String,
        rating: u8,
    ) -> Result<()> {
        //we require that the rating is between 1 and 5
        require!(
            rating >= MIN_RATING && rating <= MAX_RATING,
            MovieReviewError::InvalidRating
        );

        //we require that the title is not longer than 20 characters
        require!(
            title.len() <= MAX_TITLE_LENGTH,
            MovieReviewError::TitleTooLong
        );

        //we require that the description is not longer than 50 characters
        require!(
            description.len() <= MAX_DESCRIPTION_LENGTH,
            MovieReviewError::DescriptionTooLong
        );

        msg!("Movie review account space reallocated");
        msg!("Title: {}", title);
        msg!("Description: {}", description);
        msg!("Rating: {}", rating);

        let movie_review = &mut ctx.accounts.movie_review;
        movie_review.rating = rating;
        movie_review.description = description;

        Ok(())
    }

    pub fn delete_movie_review(_ctx: Context<DeleteMovieReview>, title: String) -> Result<()> {
        msg!("Movie review for {} deleted", title);
        Ok(())
    }

    pub fn initialize_token_mint(_ctx: Context<InitializeMint>) -> Result<()> {
        msg!("Token mint initiated!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        seeds = [b"mint"],
        bump,
        mint::decimals = 6,
        mint::authority = user,
    )]
    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(
    title: String,
)]
pub struct DeleteMovieReview<'info> {
    #[account(
        mut,
        seeds = [title.as_bytes(), initializer.key().as_ref()],
        bump,
        close = initializer
    )]
    pub movie_review: Account<'info, MovieAccountState>,

    #[account(mut)]
    pub initializer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct AddMovieReview<'info> {
    #[account(
        init,
        seeds = [title.as_bytes(), initializer.key().as_ref()],
        bump,
        payer = initializer,
        space = DISCRIMINATOR + MovieAccountState::INIT_SPACE
    )]
    pub movie_review: Account<'info, MovieAccountState>,

    #[account(mut)]
    pub initializer: Signer<'info>,

    pub system_program: Program<'info, System>,

    //token mint
    #[account(
        mut,
        seeds = [b"mint"],
        bump,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = initializer,
        associated_token::mint = mint,
        associated_token::authority = initializer,
    )]
    pub token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
#[instruction(
    title: String
)]
pub struct UpdateMovieReview<'info> {
    #[account(
        mut,
        seeds = [title.as_bytes(), initializer.key().as_ref()],
        bump,
        realloc = DISCRIMINATOR + MovieAccountState::INIT_SPACE,
        realloc::payer = initializer,
        realloc::zero = true,
    )]
    pub movie_review: Account<'info, MovieAccountState>,

    #[account(mut)]
    pub initializer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct MovieAccountState {
    pub reviewer: Pubkey, //32
    pub rating: u8,       //1
    #[max_len(20)]
    pub title: String, //4+len()
    #[max_len(50)]
    pub description: String, //4+len()
}

const DISCRIMINATOR: usize = 8;

#[error_code] //this macro will generate error types to be used as return types from our instruction handlers.
enum MovieReviewError {
    #[msg("Rating must be between 1 and 5")]
    InvalidRating,
    #[msg("Movie Title too long")]
    TitleTooLong,
    #[msg("Movie Description too long")]
    DescriptionTooLong,
}

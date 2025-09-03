# Summary of Transfer token extension of token 2022
- transfer token can be used to tax every token transfers.
- when tokens are transferred for a token with transfer token extension, it would withheld some amount according to the predefined fee basis point and maximum fee amount.
- These withheld tokens can be later move to any account by the withdraw withheld authority defined in the mint.
- Or since this is withheld in the user's token account, the user can't delete it with non zero token account. so the user has to move it to the mint which is a permissionless function.
- withhelding with user's token account allows for maximum parallel transaction at the same time. Otherwise there would be write lock, and it will bottle neck the parallelism of solana transactions specifically token transfers.
- create mint by sending a transaction including instructions in the order - create account ixn, initialize transfer fee config ixn, and finally initialize mint ixn.
- transfer token by using transfer checked function. transfer is not allowed for transfer fee extension token.


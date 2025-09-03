import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { createInitializeMintInstruction, createInitializeTransferFeeConfigInstruction, ExtensionType, getMintLen, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

/**
 * Creating a mint with a transfer fee
 */
(async () => {
    const payer = Keypair.generate();
    console.log("payer secret key or wallet");
    console.log(payer.secretKey);

    const mintAuthority = Keypair.generate();
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    const transferFeeConfigAuthority = Keypair.generate();
    const withdrawWithheldAuthority = Keypair.generate();

    const extensions = [ExtensionType.TransferFeeConfig];

    const mintLen = getMintLen(extensions);
    const decimals = 9;
    const feeBasisPoints = 50;
    const maxFee = BigInt(5_000);

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const airdropSig = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction({ signature: airdropSig, ...(await connection.getLatestBlockhash()) });

    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen);
    const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            lamports: mintLamports,
            newAccountPubkey: mint,
            programId: TOKEN_2022_PROGRAM_ID,
            space: mintLen
        }),
        createInitializeTransferFeeConfigInstruction(
            mint,
            transferFeeConfigAuthority.publicKey,
            withdrawWithheldAuthority.publicKey,
            feeBasisPoints,
            maxFee,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
            mint,
            decimals,
            mintAuthority.publicKey,
            null,
            TOKEN_2022_PROGRAM_ID
        )
    );

    const sig = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mintKeypair], undefined);
    console.log(`Check the mint tx: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
})();
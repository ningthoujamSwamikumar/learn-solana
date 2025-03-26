import dotenv from "dotenv";
//specify path to your .env
dotenv.config({ path: '../.env' });

import { airdropIfRequired, getExplorerLink, getKeypairFromEnvironment } from "@solana-developers/helpers";
import * as token from "@solana/spl-token";
import * as web3 from "@solana/web3.js"

const user = getKeypairFromEnvironment("SECRET_KEY");
console.log("keypair pubkey: ", user.publicKey.toBase58());

const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
await airdropIfRequired(
    connection,
    user.publicKey,
    1 * web3.LAMPORTS_PER_SOL,
    0.5 * web3.LAMPORTS_PER_SOL
);

console.log(`
    🔑 We've loaded our keypair securely, using an env file! Our public key is: ${user.publicKey.toBase58()}`,);

const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

const transaction = new web3.Transaction();

const mint = process.env.MINT;
if (!mint) {
    console.log("undefined mint!");
    process.exit(1);
}
const tokenMintAccount = new web3.PublicKey(mint);

//our token has two decimal places
const MINOR_UNITS_PER_MAJOR_UNITS = Math.pow(10, 2);

const RECIPIENT_WALLET = "DWR8txcukE8MCG6XXojpmwLrYMTkDfNm7q86vZpQtsrs";
const recipient = new web3.PublicKey(RECIPIENT_WALLET);

console.log(`💸 Attempting to send 1 token to ${recipient.toBase58()}`);

const senderATA = await token.getOrCreateAssociatedTokenAccount(
    connection,
    user,
    tokenMintAccount,
    user.publicKey,
);

const recieverATA = await token.getOrCreateAssociatedTokenAccount(
    connection,
    user,
    tokenMintAccount,
    recipient,
);

const transactionSignature = await token.transfer(
    connection,
    user,
    senderATA.address,
    recieverATA.address,
    user,
    1 * MINOR_UNITS_PER_MAJOR_UNITS,
)

const explorerLink = getExplorerLink(
    "transaction",
    transactionSignature,
    "devnet"
);

console.log(`✅ Transaction confirmed, explorer link is: ${explorerLink}`);

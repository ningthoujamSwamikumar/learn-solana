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
/**
 * This is a shortcut that runs:
 * SystemProgram.createAccount()
 * token.createInitializeMintInstruction()
 */
const tokenMint = await token.createMint(connection, user, user.publicKey, null, 2);

const link = getExplorerLink("address", tokenMint.toString(), "devnet");
console.log(`✅ Finished! Created token mint: ${link}`);

//Mint = "4qdoutG5hBWhYzBewhXdcWoaEXMSfyhXefkmb6gQx7nQ"

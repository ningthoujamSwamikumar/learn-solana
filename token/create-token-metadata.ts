import dotenv from "dotenv";
//specify path to your .env
dotenv.config({ path: '../.env' });

import { airdropIfRequired, getExplorerLink, getKeypairFromEnvironment } from "@solana-developers/helpers";
import * as token from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import * as mplToken from "@metaplex-foundation/mpl-token-metadata";

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

const metadata: mplToken.DataV2 = {
    name: "Solana Training Token",
    symbol: "TRAINING",
    uri: "https://arweave.net/1234",
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
};

const metadataPDAAndBump = web3.PublicKey.findProgramAddressSync(
    [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        tokenMintAccount.toBuffer()
    ],
    TOKEN_METADATA_PROGRAM_ID,
);

const createMetadataAccountInstruction = mplToken.createCreateMetadataAccountV3Instruction({
    metadata: metadataPDAAndBump[0],
    mint: tokenMintAccount,
    mintAuthority: user.publicKey,
    updateAuthority: user.publicKey,
    payer: user.publicKey,
},
    {
        createMetadataAccountArgsV3: {
            collectionDetails: null,
            data: metadata,
            isMutable: true,
        }
    });

transaction.add(createMetadataAccountInstruction);

const transactionSignature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [user],
);

const transactionLink = getExplorerLink(
    "transaction",
    transactionSignature,
    "devnet"
);

console.log(`✅ Transaction confirmed, explorer link is: ${transactionLink}`);

const tokenMintLink = getExplorerLink(
    "address",
    mint,
    "devnet",
);

console.log(`✅ Look at the token mint again: ${tokenMintLink}`);


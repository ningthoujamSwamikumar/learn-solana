//this is lesson 3 of first course: create transactions on the solana network

require("dotenv/config");
const { getKeypairFromEnvironment, airdropIfRequired } = require("@solana-developers/helpers");
//import {  } from "@solana-developers/helpers";
import { Connection, PublicKey, Transaction, clusterApiUrl, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";

const suppliedToPubkey = process.argv[2] || null;
if (!suppliedToPubkey) {
    console.log("Please provide a pub key to send to");
    process.exit(1);
}
const receiverPubkey = new PublicKey(suppliedToPubkey);
console.log("receiver pub key: ", receiverPubkey.toBase58());

const senderKeypair = getKeypairFromEnvironment("SECRET_KEY");
console.log("sender pub key: ", senderKeypair.publicKey.toBase58());

const connection = new Connection(clusterApiUrl("devnet"));
console.log("✅Loaded sender and reciever pub key, and connected to solana");

await airdropIfRequired(
    connection,
    senderKeypair.publicKey,
    10 * LAMPORTS_PER_SOL,
    1 * LAMPORTS_PER_SOL,
  );

const transaction = new Transaction();

const sendSolInstruction = SystemProgram.transfer(
    {
        fromPubkey: senderKeypair.publicKey,
        toPubkey: receiverPubkey,
        lamports: 5000,
    }
);

transaction.add(sendSolInstruction);

const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);

console.log(`💸Finished! Sent ${5000} lamports to pubkey: ${receiverPubkey}`);
console.log(`transaction signature is ${signature}!`);


//an address from devnet: RE3s2ZSjU8cgJ8hhRQg8eoNQdkefJQN5XY1E4TdYH3c
//using custom onchain program

require("dotenv/config");
const {getKeypairFromEnvironment, airdropIfRequired} = require("@solana-developers/helpers");
import * as web3 from "@solana/web3.js";

const PING_PROGRAM_ADDRESS = "ChT1B39WKLS8qUrkLvFDXMhEJ4F1XZzwUNHUt4AU9aVa";
const PING_PROGRAM_DATA_ADDRESS = "Ah9K7dQ8EHaZqcAsgBW8w37yN2eAy3koFmUn4x3CJtod";
const pingProgramId = new web3.PublicKey(PING_PROGRAM_ADDRESS);
const pingProgramDataId = new web3.PublicKey(PING_PROGRAM_DATA_ADDRESS);

const payer = getKeypairFromEnvironment("SECRET_KEY");

const transaction = new web3.Transaction();
const insn = new web3.TransactionInstruction({
    keys: [
        {
            isSigner: false,
            isWritable: true,
            pubkey: pingProgramDataId,
        },
    ],
    programId: pingProgramId,
});

const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
transaction.add(insn);
const signature = await web3.sendAndConfirmTransaction(connection, transaction, [payer]);
console.log(
  `You can view your transaction on Solana Explorer at:\nhttps:\/\/explorer.solana.com/tx/${signature}?cluster=devnet`
);


import { createAccount, mintTo, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import wallet from "./wallet.json";

/*
 * Transferring tokens with the fee checked
 * 
 * transfer_checked_with_fee function is used, as it accepts the expected fee.
 * The transfer only succeeds if the fee is correctly calculated, in order to 
 * avoid any surprises during the transfer
 */

const mint = new PublicKey("47QT2TsUpa3pcHGuQaufJwPoWQiUFWTjdhEvQ9jxwbu4"); //mint created with mint file
const payer = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const mintAmount = BigInt(1_000_000_000);
const owner = Keypair.generate();
const sourceAccount = await createAccount(
    connection,
    payer,
    mint,
    owner.publicKey,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
);




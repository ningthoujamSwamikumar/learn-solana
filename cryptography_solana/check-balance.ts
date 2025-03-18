import "dotenv/config";
const { getKeypairFromEnvironment } = require("@solana-developers/helpers");
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getDomainKeySync } from "@bonfida/spl-name-service";

const keypair = getKeypairFromEnvironment("SECRET_KEY");
console.log("keypair public key: ", keypair.publicKey.toBase58());
//const connection = new Connection(clusterApiUrl("devnet"));
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const balanceInLamports = await connection.getBalance(keypair.publicKey);
console.log("balance in lamports: ", balanceInLamports);

const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
console.log("balance in sol: ", balanceInSol);

//challenge
const newAddress = new PublicKey("DayWazALpMEGMkgn3tnWiPH5Taqiwtp5Xw5CLm4Hy7Fa");
console.log("new address works, ✅");
console.log("balance of new address: ", await new Connection(clusterApiUrl("devnet")).getBalance(newAddress));

//main net challenge
const mainnetAddress = getDomainKeySync("toly.sol").pubkey;
console.log("balance of mainnet address i.e. toly.sol: ", await new Connection(clusterApiUrl("mainnet-beta")).getBalance(mainnetAddress));
console.log("balance of mainnet address i.e. shaq.sol: ", await new Connection(clusterApiUrl("mainnet-beta")).getBalance(getDomainKeySync("shaq.sol").pubkey));



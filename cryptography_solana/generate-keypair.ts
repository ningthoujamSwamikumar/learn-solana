require("dotenv/config");
const {getKeypairFromEnvironment} = require("@solana-developers/helpers");


const keypair = getKeypairFromEnvironment("SECRET_KEY");

console.log("✅ key pair gerated from env!");
console.log("original public key: ", keypair.publicKey.toString(), "; base58 public key: ", keypair.publicKey.toBase58());


// import {Keypair} from "@solana/web3.js"

// const keypair = Keypair.generate();
// console.log("✅key pair generated");

// console.log("public key: ", keypair.publicKey.toBase58());
// console.log("secret key: ", keypair.secretKey);





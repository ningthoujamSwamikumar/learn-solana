import * as web3 from "@solana/web3.js"; 

const keypair = web3.Keypair.generate();
console.log("keypair secret: ", keypair.secretKey);
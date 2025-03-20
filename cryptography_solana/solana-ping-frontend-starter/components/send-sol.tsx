import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import React, { useState } from 'react'

export default function SendSol() {
    const {connection} = useConnection();
    const {publicKey, sendTransaction} = useWallet();

    const [reciever, setReciever] = useState("");

    const send = async ()=>{
        if(!reciever){
            console.error("Enter a valid reciever address.");
        }
        if(!connection || !publicKey){
			console.error("Wallet not connected or connection unavailable");
		}
        try {
            const recieverPubkey = new PublicKey(reciever);
            const transaction = new Transaction();
            const sendSolInsn = SystemProgram.transfer({fromPubkey: publicKey, lamports: 20000, toPubkey: recieverPubkey});
            transaction.add(sendSolInsn);
            const signature = await sendTransaction(transaction, connection);
            console.log("transfer signature:", signature);
        }catch(error){
            console.error("failed transfer:", error);
        }
    }

    return (
        <div>
            <h4>
                send-sol
            </h4>
            <label htmlFor='address'>Enter Reciever address</label>
            <input id='address' onChange={(e)=>setReciever(e.target.value)} />
            <button onClick={send}>Send</button>
        </div>
    )
}

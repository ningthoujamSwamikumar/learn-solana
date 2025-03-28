"use client"

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import React, { FormEvent, useRef, useState } from 'react'
import { toast } from 'sonner';

const SendSol = () => {
    const [sign, setSign] = useState("");
    
    const [reciever, setReciever] = useState("");
    const [amount, setAmount] = useState("");

    const { connection } = useConnection();
    const { publicKey: user, sendTransaction } = useWallet();

    const formRef = useRef<HTMLFormElement |
        null>(null);

    const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!reciever || !amount || !parseInt(amount)) {
            toast("Please provide all required fields!");
            return;
        }

        if (!user || !connection) {
            toast("Please connect your wallet!");
            return;
        }

        let recieverAddress;
        try {
            recieverAddress = new PublicKey(reciever);
        } catch (err) {
            toast("Invalid reciever address!");
            console.error("Invalid reciever: ", err);
            return;
        }

        try {
            const transaction = new Transaction();
            const sendSolInsn = SystemProgram.transfer({
                fromPubkey: user,
                toPubkey: recieverAddress,
                lamports: parseInt(amount) * LAMPORTS_PER_SOL,
            });
            transaction.add(sendSolInsn);

            const txnSignature = await sendTransaction(transaction, connection);
            toast("✅ Transaction Successful");
            setSign(txnSignature);
        } catch (err) {
            toast("❌ Transaction Failed!");
            console.error("Txn Failed: ", err);
        }
    }

    return (
        <div className='w-96 p-4 rounded-lg bg-neutral-900 space-y-4'>
            <h3 className='text-center text-4xl font-extralight'>SOL</h3>
            <form ref={formRef} id="send-sol-form" className='flex flex-col space-y-4' onSubmit={submitHandler}>
                <label htmlFor='sol-reciever' className='font-semibold text-lg'>SOL Reciever</label>
                <input id='sol-reciever' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setReciever(e.target.value)} required />

                <label htmlFor='sol-amnt' className='font-semibold text-lg'>SOL Amount</label>
                <input id='sol-amnt' type='number' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setAmount(e.target.value)} required />

                <button className='bg-neutral-800 hover:bg-neutral-700 hover:cursor-pointer rounded-lg p-2' type='submit'>Send And Confirm</button>
            </form>
            {!!sign &&
                <div className='text-center flex flex-col space-y-2'>
                    <p className='flex justify-center'>
                    <a href={`https://explorer.solana.com/tx/${sign}?cluster=devnet`} className='hover:underline decoration-blue-400 text-blue-400 visited:text-purple-600 visited:decoration-purple-600' target='_blank'>View Transaction</a>✅
                    </p>
                    <button
                        className='bg-neutral-800 hover:bg-neutral-700 hover:cursor-pointer rounded-lg p-2'
                        onClick={() => {
                            if (formRef.current) {
                                formRef.current.reset();
                                setSign("");
                            }
                        }}
                    >
                        New
                    </button>
                </div>
            }
        </div>
    )
}

export default SendSol;
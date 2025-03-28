"use client"

import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress, getMint } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import React, { FormEvent, useRef, useState } from 'react'
import { toast } from 'sonner';

const SendToken = () => {
    const [sign, setSign] = useState("");

    const [mintAddr, setMintAddr] = useState("");
    const [recieverAddr, setRecieverAddr] = useState("");
    const [amount, setAmount] = useState("");

    const { connection } = useConnection();
    const { publicKey: user, sendTransaction } = useWallet();

    const formRef = useRef<HTMLFormElement |
        null>(null);

    const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!mintAddr || !recieverAddr || !amount || !parseInt(amount)) {
            toast("Please provide all required fields!");
            return;
        }

        if (!user || !connection) {
            toast("Please connect your wallet!");
            return;
        }

        let reciever;
        let mintPubkey;
        let mint;
        let programId;
        try {
            reciever = new PublicKey(recieverAddr);
        } catch (err) {
            toast("Invalid reciever address!");
            console.error("Invalid reciever: ", err);
            return;
        }
        try {
            mintPubkey = new PublicKey(mintAddr);
            const mintAccountInfo = await connection.getAccountInfo(mintPubkey, "confirmed");
            programId = new PublicKey(mintAccountInfo!.owner.toBase58());
            mint = await getMint(connection, mintPubkey);
        } catch (err) {
            toast("Invalid mint address!");
            console.error("Invalid mint address:", err);
        }

        try {
            const transaction = new Transaction();

            const recieverATA = await getAssociatedTokenAddress(mintPubkey!, reciever);
            const recieverATAInfo = await connection.getAccountInfo(recieverATA);
            if (!recieverATAInfo) {
                //not already exist so need to create one
                const createATAInsn = await createAssociatedTokenAccountInstruction(
                    user,
                    recieverATA,
                    reciever,
                    mintPubkey!
                );
                transaction.add(createATAInsn);
            }

            const MINOR_PER_MAJOR = Math.pow(10, mint!.decimals);

            const sourceATA = await getAssociatedTokenAddress(mintPubkey!, user);
            const sendTokenInsn = createTransferInstruction(
                sourceATA,
                recieverATA,
                user,
                parseInt(amount) * MINOR_PER_MAJOR,
            );
            transaction.add(sendTokenInsn);

            const txnSignature = await sendTransaction(transaction, connection);
            toast("✅ Transaction Successful");
            setSign(txnSignature);
        } catch (err) {
            toast("❌ Transaction Failed!");
            console.error("Txn Failed: ", err);
        }
    }

    return (
        <main className="mt-8 flex flex-col space-y-4 justify-center items-center">
            <div className='w-96 p-4 rounded-lg bg-neutral-900 space-y-4'>
                <h3 className='text-center text-4xl font-extralight'>Token</h3>
                <form ref={formRef} className='flex flex-col space-y-4' onSubmit={submitHandler}>
                    <label htmlFor='token-mint' className='font-semibold text-lg'>Token Mint Address</label>
                    <input id='token-mint' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setMintAddr(e.target.value)} />

                    <label htmlFor='token-reciever' className='font-semibold text-lg'>Token Reciever</label>
                    <input id='token-reciever' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setRecieverAddr(e.target.value)} />

                    <label htmlFor='token-amnt' className='font-semibold text-lg'>Token Amount</label>
                    <input id='token-amnt' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setAmount(e.target.value)} />

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
        </main>
    )
}

export default SendToken;
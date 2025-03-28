"use client";

import * as splToken from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import React, { Dispatch, FC, FormEvent, SetStateAction, useRef, useState } from 'react';
import { toast } from 'sonner';

const CreateToken: FC<{ setMintPubkey: Dispatch<SetStateAction<string>> }> = ({ setMintPubkey }) => {
    const [sign, setSign] = useState("");
    const [mint, setMint] = useState("");
    const formRef = useRef<HTMLFormElement>(null);
    //user inputs
    const [program, setProgram] = useState<"legacy" | "extension">("legacy");
    const [decimal, setDecimal] = useState(0);
    const [mintAuth, setMintAuth] = useState("");
    const [freezeAuth, setFreezeAuth] = useState("");
    //wallet
    const { connection } = useConnection();
    const { publicKey: user, sendTransaction } = useWallet();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!program || !decimal || !mintAuth) {
            toast("Please provide all the required inputs");
            return;
        }

        if (!connection || !user) {
            toast("Invalid Connection! Please retry again!");
            return;
        }

        let mintAuthPubkey;
        let freezeAuthPubkey;
        try {
            mintAuthPubkey = new web3.PublicKey(mintAuth);
            freezeAuthPubkey = freezeAuth ? new web3.PublicKey(freezeAuth) : null;
        } catch (err) {
            toast("Invalid Input!");
            console.error("Invalid input: ", err);
        }

        try {
            const programId = program === "extension" ? splToken.TOKEN_2022_PROGRAM_ID : splToken.TOKEN_PROGRAM_ID;
            //create mint account key pair
            const mintKeypair = web3.Keypair.generate();
            const rent = await splToken.getMinimumBalanceForRentExemptMint(
                connection,
                "confirmed"
            );
            //create mint Account instruction
            const createMintAccountInsn = web3.SystemProgram.createAccount(
                {
                    fromPubkey: user,
                    lamports: rent,
                    newAccountPubkey: mintKeypair.publicKey,
                    programId,
                    space: splToken.MINT_SIZE
                }
            );
            //initialise mint instruction
            const initMintInsn = splToken.createInitializeMintInstruction(
                mintKeypair.publicKey,
                decimal,
                mintAuthPubkey!,
                freezeAuthPubkey!,
                programId
            );
            //transaction
            const transaction = new web3.Transaction();
            transaction.add(createMintAccountInsn, initMintInsn);

            //submit transaction to sign and send
            const txnSig = await sendTransaction(transaction, connection, { signers: [mintKeypair] });
            toast("✅ Transaction Successful");
            setSign(txnSig);
            setMint(mintKeypair.publicKey.toString());
        } catch (err: any) {
            toast("❌ Transaction Failed");
            console.error("Transaction failed: ", err instanceof web3.SendTransactionError ? await err.getLogs(connection) : err);
        }
    }

    return (
        <div className='w-96 p-4 rounded-lg bg-neutral-900'>
            <form ref={formRef} className='flex flex-col space-y-4' onSubmit={handleSubmit}>
                <label htmlFor='token-program' className='rounded-sm font-semibold text-lg'>Token Program</label>
                <select id='token-program' onChange={(e) => setProgram(e.target.value === "legacy" ? "legacy" : "extension")} className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md bg-neutral-900 space-y-2'>
                    <option value={"legacy"} >Legacy</option>
                    <option value={"extension"} >Extension</option>
                </select>

                <label htmlFor='decimal' className='font-semibold text-lg'>Decimal Places</label>
                <input id='decimal' type='number' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setDecimal(Number(e.target.value))} required />

                <label htmlFor='mint-auth' className='font-semibold text-lg'>Mint Authority</label>
                <input id='mint-auth' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setMintAuth(e.target.value)} required />

                <label htmlFor='freeze-auth' className='font-semibold text-lg'>Freeze Authority</label>
                <input id='freeze-auth' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setFreezeAuth(e.target.value)} />

                <button className='bg-neutral-800 hover:bg-neutral-700 hover:cursor-pointer rounded-lg p-2 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:pointer-events-none' type='submit' disabled={!!sign}>Create Token Mint</button>
            </form>

            {!!sign &&
                <div className='text-center flex flex-col space-y-2'>
                    <p className='flex justify-center'>
                        <a href={`https://explorer.solana.com/tx/${sign}?cluster=devnet`} className='hover:underline decoration-blue-400 text-blue-400 visited:text-purple-600 visited:decoration-purple-600' target='_blank'>View Transaction</a>✅
                    </p>
                    <button
                        className='bg-neutral-800 hover:bg-neutral-700 hover:cursor-pointer rounded-lg p-2'
                        onClick={() => {
                            setMintPubkey(mint);
                        }}
                    >
                        Next {">>>"}
                    </button>
                </div>
            }
        </div>
    )
}

export default CreateToken;

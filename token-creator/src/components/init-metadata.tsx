"use client";

import * as mplToken from '@metaplex-foundation/mpl-token-metadata';
import * as splToken from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import React, { FC, FormEvent, useState } from 'react';
import { URL } from 'url';
import { METADATA_PROGRAM_ID } from './contants';
import { toast } from 'sonner';

const InitTokenMetada: FC<{ mint: string }> = ({ mint }) => {
    const [sign, setSign] = useState("");
    //metadata
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [updateAuth, setUpdateAuth] = useState("");
    const [metaUri, setMetaUri] = useState("");
    //wallet
    const { connection } = useConnection();
    const { publicKey: user, sendTransaction } = useWallet();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!metaUri || !name || !symbol) {
            toast("Please provide all the required inputs");
            return;
        }

        if (!connection || !user) {
            toast("Invalid Connection! Please connect to a wallet.");
            return;
        }

        let updateAuthPubkey;
        try {
            //new URL(metaUri);
            updateAuthPubkey = new web3.PublicKey(updateAuth);
        } catch (err) {
            console.error("Invalid input. error: ", err);
            toast("Invalid Input!");
            return;
        }
        let mintPubkey;
        try {
            mintPubkey = new web3.PublicKey(mint);
            const mintAccountInfo = await connection.getAccountInfo(mintPubkey, "confirmed");
            const tokenMint = await splToken.getMint(connection, mintPubkey, "confirmed", mintAccountInfo?.owner);
            //derive metadata pda
            const [metadataPDA, _] = web3.PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    METADATA_PROGRAM_ID.toBuffer(),
                    mintPubkey.toBuffer(),
                ],
                METADATA_PROGRAM_ID
            );
            const metadata: mplToken.DataV2 = {
                collection: null,
                creators: null,
                name,
                sellerFeeBasisPoints: 0,
                symbol,
                uri: metaUri,
                uses: null
            };
            //create instruction to create metadata account and to attatch to the token
            //this instruction needs the mint's update authority to be the signer means, we should use the wallet of update authority to sign
            // and send this transaction, in other words, only the mint's update authority can update metadata for that token mint
            //another thing about this instruction is that it doesn't support token's created with token extension program or TOKEN_2022_PRGRAM_ID
            const createMetadataAccountInsn = mplToken.createCreateMetadataAccountV3Instruction(
                {
                    metadata: metadataPDA,
                    mint: mintPubkey,
                    mintAuthority: tokenMint.mintAuthority!,
                    payer: user,
                    updateAuthority: updateAuthPubkey!
                },
                {
                    createMetadataAccountArgsV3: {
                        data: metadata,
                        isMutable: true,
                        collectionDetails: null
                    }
                }
            );

            const transaction = new web3.Transaction().add(createMetadataAccountInsn);
            const txnSignature = await sendTransaction(transaction, connection);
            toast("✅ Transaction Successfull.");
            setSign(txnSignature);
        } catch (err) {
            toast("❌ Transaction Failed.");
            console.error("Transaction Failed: ", err);
        }
    }

    return (
        <div className='w-96 p-4 rounded-lg bg-neutral-900'>
            <form className='flex flex-col space-y-4' onSubmit={handleSubmit}>

                {/* data and metadata for the token */}
                <label htmlFor='name' className='font-semibold text-lg'>Name</label>
                <input id='name' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setName(e.target.value)} required />

                <label htmlFor='symbol' className='font-semibold text-lg'>Symbol</label>
                <input id='symbol' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setSymbol(e.target.value)} required />

                <label htmlFor='meta-update-auth' className='font-semibold text-lg'>Metadata Update Authority</label>
                <input id='meta-update-auth' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setUpdateAuth(e.target.value)} />

                <label htmlFor='meta-uri' className='font-semibold text-lg'>Metadata URI</label>
                <input id='meta-uri' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setMetaUri(e.target.value)} required />

                <button className='bg-neutral-800 hover:bg-neutral-700 hover:cursor-pointer rounded-lg p-2 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:pointer-events-none' type='submit' disabled={!!sign}>Init Metadata</button>
            </form>
            {!!sign &&
                <div className='text-center flex flex-col space-y-2'>
                    <p className='flex justify-center'>
                        <a href={`https://explorer.solana.com/tx/${sign}?cluster=devnet`} className='hover:underline decoration-blue-400 text-blue-400 visited:text-purple-600 visited:decoration-purple-600' target='_blank'>View Transaction</a>✅
                    </p>
                    <button
                        className='bg-neutral-800 hover:bg-neutral-700 hover:cursor-pointer rounded-lg p-2'
                        onClick={() => {
                            window.location.reload();
                        }}
                    >
                        Create New Token
                    </button>
                </div>
            }
        </div>);
}

export default InitTokenMetada;
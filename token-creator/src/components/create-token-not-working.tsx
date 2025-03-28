"use client";

import * as mplToken from '@metaplex-foundation/mpl-token-metadata';
//import { getExplorerLink } from '@solana-developers/helpers';
import * as splToken from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import React, { FormEvent, useState } from 'react';
import { URL } from 'url';
import { METADATA_PROGRAM_ID } from './contants';
import { toast } from 'sonner';

const CreateTokenForm = () => {
    const [program, setProgram] = useState<"legacy" | "extension">("legacy");
    const [decimal, setDecimal] = useState(0);
    const [mintAuth, setMintAuth] = useState("");
    const [freezeAuth, setFreezeAuth] = useState("");
    //metadata
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [updateAuth, setUpdateAuth] = useState("");
    const [metaUri, setMetaUri] = useState("");
    //wallet
    const { connection } = useConnection();
    const { publicKey: user, connect, sendTransaction } = useWallet();
    //
    const [mint, setMint] = useState("");
    const [signature, setSignaure] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!connection || !user) {
            toast("Invalid Connection! Please retry again!");
            return;
        }

        if (!program || !decimal || !mintAuth || !metaUri || !name || !symbol) {
            toast("Invalid inputs! Please provide all the required inputs");
            return;
        }

        try {
            const mintAccount = web3.Keypair.generate();
            const mintRent = await splToken.getMinimumBalanceForRentExemptMint(connection);
            const programId = program === "extension" ? splToken.TOKEN_2022_PROGRAM_ID : splToken.TOKEN_PROGRAM_ID;
            const mintAuthority = new web3.PublicKey(mintAuth);
            const freezeAuthority = new web3.PublicKey(freezeAuth);
            // const url = new URL(metaUri ?? "");
            // console.log("url: ", url);
            const metadata: mplToken.DataV2 = {
                name,
                symbol,
                sellerFeeBasisPoints: 0,
                uri: metaUri,
                creators: null,
                collection: null,
                uses: null
            };

            console.log("metadata program id: ", mplToken.PROGRAM_ID);

            const metadataPDAAndBump = web3.PublicKey.findProgramAddressSync(
                [Buffer.from("metadata"), mintAccount.publicKey.toBuffer()],
                mplToken.PROGRAM_ID
            );

            const transaction = new web3.Transaction().add(
                web3.SystemProgram.createAccount(
                    {
                        fromPubkey: user,
                        space: splToken.MINT_SIZE,
                        newAccountPubkey: mintAccount.publicKey,
                        lamports: mintRent,
                        programId,
                    }
                ),
                splToken.createInitializeMintInstruction(
                    mintAccount.publicKey,
                    decimal,
                    mintAuthority,
                    freezeAuthority,
                    programId
                ),
                mplToken.createCreateMetadataAccountV3Instruction(
                    {
                        metadata: metadataPDAAndBump[0],
                        mint: mintAccount.publicKey,
                        mintAuthority: new web3.PublicKey(mintAuth),
                        payer: user,
                        updateAuthority: new web3.PublicKey(updateAuth),
                    },
                    {
                        createMetadataAccountArgsV3: {
                            collectionDetails: null,
                            data: metadata,
                            isMutable: true,
                        }
                    }
                )
            );

            const signature = await sendTransaction(transaction, connection);
            const link = ""; //getExplorerLink("transaction", signature, "devnet");
            toast(`✅ Mint Created! Find it on ${<a href={link}>Solana Explorer</a>}`);

            setMint(mintAccount.publicKey.toString());
            setSignaure(signature);

            event.currentTarget.reset();
        } catch (error) {
            toast("Oops! Something Went Wrong!");
            console.error("error: ", error);
        }

    }

    return (
        <div className='w-96 p-4 rounded-lg bg-neutral-900'>
            <form className='flex flex-col space-y-4' onSubmit={handleSubmit}>
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

                {/* data and metadata for the token */}
                <label htmlFor='name' className='font-semibold text-lg'>Name</label>
                <input id='name' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setName(e.target.value)} required />

                <label htmlFor='symbol' className='font-semibold text-lg'>Symbol</label>
                <input id='symbol' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setSymbol(e.target.value)} required />

                <label htmlFor='meta-update-auth' className='font-semibold text-lg'>Metadata Update Authority</label>
                <input id='meta-update-auth' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setUpdateAuth(e.target.value)} />

                <label htmlFor='meta-uri' className='font-semibold text-lg'>Metadata URI</label>
                <input id='meta-uri' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setMetaUri(e.target.value)} required />

                <button className='bg-neutral-800 hover:bg-neutral-700 hover:cursor-pointer rounded-lg p-2' type='submit'>Create</button>
            </form>

            {
                signature && mint && (
                    <div>
                        <p>Mint Created: {mint}</p>
                        <p>Transaction Signature: {signature}</p>
                    </div>
                )
            }
        </div>
    )
}

export default CreateTokenForm;

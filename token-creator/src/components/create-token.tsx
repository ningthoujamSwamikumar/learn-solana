"use client"

import React, { FC, useState } from 'react'

const CreateTokenForm = () => {
    const [program, setProgram] = useState("legacy");
    const [decimal, setDecimal] = useState(0);
    const [mintAuth, setMintAuth] = useState("");
    const [freezeAuth, setFreezeAuth] = useState("");
    const [metaUri, setMetaUri] = useState("");

    return (
        <div className='w-96 p-4 rounded-lg bg-neutral-900'>
            <form className='flex flex-col space-y-4'>
                <label htmlFor='token-program' className='rounded-sm font-semibold text-lg'>Token Program</label>
                <select id='token-program' onChange={(e) => setProgram(e.target.value)} className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md bg-neutral-900 space-y-2'>
                    <option value={"legacy"} >Legacy</option>
                    <option value={"extension"} >Extension</option>
                </select>

                <label htmlFor='decimal' className='font-semibold text-lg'>Decimal Places</label>
                <input id='decimal' type='number' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setDecimal(Number(e.target.value))} />
                <label htmlFor='mint-auth' className='font-semibold text-lg'>Mint Authority</label>
                <input id='mint-auth' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setMintAuth(e.target.value)} />
                <label htmlFor='freeze-auth' className='font-semibold text-lg'>Freeze Authority</label>
                <input id='freeze-auth' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setFreezeAuth(e.target.value.toString)} />
                <label htmlFor='meta-uri' className='font-semibold text-lg'>Metadata URI</label>
                <input id='meta-uri' className='border focus:outline-offset-4 focus:border-2 p-2 rounded-md ' onChange={(e) => setMetaUri(e.target.value.toString())} />

                <button className='bg-neutral-800 hover:bg-neutral-700 hover:cursor-pointer rounded-lg p-2'>Create</button>
            </form>
        </div>
    )
}

export default CreateTokenForm;
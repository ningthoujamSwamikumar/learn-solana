"use client"

import CreateToken from '@/components/create-token-working';
import InitTokenMetada from '@/components/init-metadata';
import React, { useState } from 'react'

const Home = () => {
    const [mintPubkey, setMintPubkey] = useState("");

    return (
        <div className='flex justify-center items-center'>
            {!mintPubkey && <CreateToken setMintPubkey={setMintPubkey} />}
            {!!mintPubkey && <InitTokenMetada mint={mintPubkey} />}
        </div>
    );
}

export default Home;
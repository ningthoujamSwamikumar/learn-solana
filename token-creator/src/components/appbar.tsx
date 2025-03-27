"use client"

import "@solana/wallet-adapter-react-ui/styles.css"
import dynamic from 'next/dynamic';
import Link from 'next/link'
import React from 'react'
import { ToastContainer } from "react-toastify";

const ReactUIWalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

export default function Appbar() {
    return (
        <div className='flex h-16 border-b sticky top-0 border-b-white justify-evenly items-center bg-black opacity-90'>
            <Link href={'/'} className='font-extrabold text-4xl hover:bg-neutral-800 p-2 rounded-lg' >Token Creator</Link>
            <Link href={'/send-token'} className='align-middle self-center text-white text-2xl font-light hover:bg-neutral-700  bg-neutral-800 py-2 px-4 rounded-lg'>Send Token</Link>
            <ReactUIWalletMultiButtonDynamic />
            <ToastContainer />
        </div>
    )
};

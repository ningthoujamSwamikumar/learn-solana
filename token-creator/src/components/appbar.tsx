"use client"

import "@solana/wallet-adapter-react-ui/styles.css"
import dynamic from 'next/dynamic';
import Link from 'next/link'
import React from 'react'
import { Toaster } from "sonner";

const ReactUIWalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

export default function Appbar() {
    return (
        <div className='flex h-16 border-b sticky top-0 border-b-white justify-between items-center bg-black px-8'>
            <div className="flex w-fit space-x-12 items-baseline">
                <Link href={'/'} className='font-extrabold text-4xl hover:bg-neutral-800 p-2 rounded-lg' >Token Creator</Link>
                <Link href={'/transfer'}
                    className='hover:underline underline-offset-2'>
                    Transfers
                </Link>
            </div>
            <ReactUIWalletMultiButtonDynamic className="" />
        </div>
    )
};

"use client"

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import React, { FC, ReactNode, useMemo } from 'react'
import Appbar from './appbar';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const endpoint = clusterApiUrl("devnet");
    const wallets = useMemo(() => [], []);
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <Appbar />
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}

export default WalletContextProvider;
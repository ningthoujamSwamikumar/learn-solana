import { FC, useState } from 'react'
import styles from '../styles/PingButton.module.css'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

const PROGRAM_ID = "ChT1B39WKLS8qUrkLvFDXMhEJ4F1XZzwUNHUt4AU9aVa";
const DATA_ACCOUNT_PUBKEY = "Ah9K7dQ8EHaZqcAsgBW8w37yN2eAy3koFmUn4x3CJtod";

export const PingButton: FC = () => {
	const { connection } = useConnection();
	const {publicKey, sendTransaction} = useWallet();

    const onClick = async() => {
        if(!connection || !publicKey){
			console.error("Wallet not connected or connection unavailable");
		}
		try {
			const programId = new PublicKey(PROGRAM_ID);
			const programDataAccount = new PublicKey(DATA_ACCOUNT_PUBKEY);
			const transaction = new Transaction();

			const instruction = new TransactionInstruction({
				keys: [
					{
						pubkey: programDataAccount,
						isSigner: false,
						isWritable: true,
					},
				],
				programId,
			});
			transaction.add(instruction);

			const signature = await sendTransaction(transaction, connection);
			console.log("Transaction Signature:", signature);
		}catch(error){
			console.error("Transaction failed:", error);
		}
    }
    
	return (
		<div className={styles.buttonContainer} onClick={onClick}>
			<button className={styles.button}>Ping!</button>
		</div>
	)
}


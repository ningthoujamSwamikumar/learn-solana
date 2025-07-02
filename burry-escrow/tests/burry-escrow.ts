import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BurryEscrow } from "../target/types/burry_escrow";
import { clusterApiUrl, Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { AggregatorAccount, AnchorWallet, SwitchboardProgram } from "@switchboard-xyz/solana.js";
import { confirmTransaction } from "@solana-developers/helpers";
import { Big } from "@switchboard-xyz/common";
import { assert } from "chai";

const SOL_USD_SWITCHBOARD_FEED = new PublicKey(
  "GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR",
);

const ESCROW_SEED = "MICHAEL BURRY2";
const PRICE_OFFSET = 10;
const ESCROW_AMOUNT = new anchor.BN(100);
const EXPECTED_ERROR_MESSAGE = "Current SOL price is not above Escrow unlock price.";

describe("burry-escrow", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();

  const program = anchor.workspace.burryEscrow as Program<BurryEscrow>;
  const payer = (provider.wallet as AnchorWallet).payer;

  let switchboardProgram: SwitchboardProgram;
  let aggregatorAccount: AggregatorAccount;

  before(async () => {
    switchboardProgram = await SwitchboardProgram.load(provider.connection, payer);
    aggregatorAccount = new AggregatorAccount(
      switchboardProgram,
      SOL_USD_SWITCHBOARD_FEED,
    );
  });

  const createAndVerifyEscrow = async (unlockPrice: number) => {
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from(ESCROW_SEED), payer.publicKey.toBuffer()],
      program.programId
    );

    try {
      const transaction = await program.methods
        .deposit(ESCROW_SEED, ESCROW_AMOUNT, unlockPrice)
        .accountsPartial({
          user: payer.publicKey,
          escrowAccount: escrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([payer])
        .rpc();

      await confirmTransaction(
        provider.connection,
        transaction
      );

      const escrowAccount = await program.account.escrow.fetch(escrow);
      const escrowBalance = await provider.connection.getBalance(escrow);

      console.log("Onchain unlock price:", escrowAccount.unlockPrice);
      console.log("Amount in escrow:", escrowBalance);

      assert(unlockPrice === escrowAccount.unlockPrice);
      assert(escrowBalance > 0);
    } catch (error) {
      console.log("Error details:", error);
      throw new Error(`Failed to create escrow: ${error instanceof Error ? error.message : ""}`);
    }
  }

  it("creates Burry Escrow Below Current Price", async () => {
    const solPrice: Big | null = await aggregatorAccount.fetchLatestValue();
    if (solPrice === null) {
      throw new Error("Aggregator holds no value");
    }
    //although `SOL_USD_SWITCHBOARD_FEED` is not changing we are
    // changing the unlockPrice in test as given below to simulate the 
    // escrow behavior
    const unlockPrice = solPrice.minus(PRICE_OFFSET).toNumber();

    await createAndVerifyEscrow(unlockPrice);
  });

  it("withdraws from escrow", async () => {
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from(ESCROW_SEED), payer.publicKey.toBuffer()],
      program.programId
    );

    const userBalanceBefore = await provider.connection.getBalance(
      payer.publicKey
    );

    try {
      const transaction = await program.methods
        .withdraw(ESCROW_SEED)
        .accountsPartial({
          user: payer.publicKey,
          escrowAccount: escrow,
          feedAggregator: SOL_USD_SWITCHBOARD_FEED,
          systemProram: SystemProgram.programId
        })
        .signers([payer])
        .rpc();

      await confirmTransaction(
        provider.connection,
        transaction,
      );

      //verify escrow account is closed
      try {
        await program.account.escrow.fetch(escrow);
        assert.fail("Escrow account should have been closed");
      } catch (error) {
        console.log(error.message);
        if (error instanceof Error) {
          assert(
            error.message.includes("Account does not exist"),
            "Unexpected error: " + error.message
          );
        }
      }

      //verify user balance increased
      const userBalanceAfter = await provider.connection.getBalance(payer.publicKey);
      assert(
        userBalanceAfter > userBalanceBefore,
        "User balance should have increased"
      );
    } catch (error) {
      throw new Error(`Failed to withdraw from escrow: ${error instanceof Error ? error.message : ""}`);
    }
  });

  it("creates Burry Escrow Above Current Price", async () => {
    const solPrice: Big | null = await aggregatorAccount.fetchLatestValue();
    if (solPrice === null) {
      throw new Error("Aggregator holds no value");
    }
    //although `SOL_USD_SWITCHBOARD_FEED` is not changing we are
    // changing the unlockPrice in test as given below to simulate the 
    // escrow behavior
    const unlockPrice = solPrice.plus(PRICE_OFFSET).toNumber();
    await createAndVerifyEscrow(unlockPrice);
  });

});

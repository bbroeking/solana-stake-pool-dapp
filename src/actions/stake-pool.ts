import { approve } from "@project-serum/serum/lib/token-instructions";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { 
    Connection,
    Keypair,
    LAMPORTS_PER_SOL, 
    PublicKey, 
    StakeProgram, 
    SystemProgram, 
    SYSVAR_CLOCK_PUBKEY, 
    SYSVAR_STAKE_HISTORY_PUBKEY, 
    TransactionCtorFields, 
    TransactionInstruction 
} from "@solana/web3.js";
import BN from "bn.js";
import { serialize } from 'borsh';
import { addAssociatedTokenAccount, CleanupRemovedValidatorEntries, CLEANUP_REMOVED_VALIDATOR_ENTRIES, DepositSolSchema, DEPOSIT_SOL_SCHEMA, prettyPrintPublicKey, STAKE_POOL_PROGRAM_ID, StringPublicKey, toPublicKey, UpdateStakePoolBalanceSchema, UpdateValidatorListBalanceSchema, UPDATE_STAKE_POOL_BALANCE_SCHEMA, UPDATE_VALIDATOR_LIST_BALANCE_SCHEMA, WithdrawSolSchema, WITHDRAW_SOL_SCHEMA } from ".";
import { decodePublicKey, prettyPrintPubKey } from "../components/StakePoolDisplay";
import { sendTransaction } from "../contexts/connection";
import { StakePoolAccount, StakePoolAccounts, ValidatorListAccount } from "../models/stake-pool";
import { toLamports } from "../utils/utils";
import { ValidatorList, ValidatorStakeInfo } from "../views/home/schema";

export async function sendDepositSol(
    connection: Connection,
    wallet: WalletContextState,
    stake_pool: StakePoolAccount,
    amount: number
) {
    const signers: Keypair[][] = [];
    const instructions: TransactionInstruction[][] = [];
    
    const deposit = await setupDepositSol(wallet, stake_pool, instructions, signers, amount, connection);
    await sendTransaction(
        connection,
        wallet,
        instructions[0],
        signers[0],
    );

    return deposit;
};

export async function setupDepositSol(
    wallet: WalletContextState,
    stake_pool: StakePoolAccount,
    overallInstructions: TransactionInstruction[][],
    overallSigners: Keypair[][],
    amount: number,
    connection: Connection,
    referrerTokenAccount?: PublicKey,
) {
    if (!wallet.publicKey) throw new WalletNotConnectedError();
    let signers: Keypair[] = [];
    let instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];

    const withdrawAuthorityProgramAddress = await PublicKey.findProgramAddress(
        [stake_pool.pubkey.toBuffer(), Buffer.from("withdraw")],
        stake_pool.account.owner
    )

    const tokenAccount = undefined;
    const lamports_from = new Keypair();
    instructions.push(
      SystemProgram.transfer({
        /** Account that will transfer lamports */
        fromPubkey: wallet.publicKey,
        /** Account that will receive transferred lamports */
        toPubkey: lamports_from.publicKey,
        /** Amount of lamports to transfer */
        lamports: 1 * LAMPORTS_PER_SOL
      })
    );
    signers.push(lamports_from);
    const poolMint = prettyPrintPubKey(stake_pool.account.data.poolMint); 
    const pool_token_receiver_account = await addAssociatedTokenAccount(
        connection,
        wallet.publicKey,
        new PublicKey(poolMint),
        instructions,
        signers
    );

    const referrer_token_account = referrerTokenAccount || pool_token_receiver_account // referral account
    const stake_pool_str = stake_pool.pubkey;
    const authority = withdrawAuthorityProgramAddress[0];
    const reserveStake = prettyPrintPubKey(stake_pool.account.data.reserveStake);
    const managerFee = prettyPrintPubKey(stake_pool.account.data.managerFeeAccount);

    const depoSol = depositSol(
        stake_pool_str,
        authority,
        reserveStake,
        lamports_from.publicKey,
        pool_token_receiver_account!,
        managerFee,
        referrer_token_account!, 
        poolMint,
        instructions,
        amount
    )

    overallInstructions.push([...instructions, ...cleanupInstructions]);
    overallSigners.push(signers);
    return depoSol;
}

export function depositSol(
    stake_pool: PublicKey,
    stake_pool_withdraw_authority: PublicKey,
    reserve_stake_account: StringPublicKey,
    lamports_from: PublicKey,
    pool_tokens_to: PublicKey,
    manager_fee_account: StringPublicKey,
    referrer_pool_tokens_account: PublicKey,
    pool_mint: StringPublicKey,
    instructions: TransactionInstruction[],
    amount: number // SOL
) {
    const lamports = amount * LAMPORTS_PER_SOL;
    const data = Buffer.from(
        serialize(
            DEPOSIT_SOL_SCHEMA,
            new DepositSolSchema({
                amount: new BN(lamports)
            }),
        )
    );
    const keys= [
        {
            pubkey: stake_pool,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: stake_pool_withdraw_authority,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: toPublicKey(reserve_stake_account),
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: toPublicKey(lamports_from),
            isSigner: true,
            isWritable: false,
        },
        {
            pubkey: pool_tokens_to,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: toPublicKey(manager_fee_account),
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: referrer_pool_tokens_account,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: toPublicKey(pool_mint),
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
        },
    ];
    
    instructions.push(new TransactionInstruction({
        keys,
        programId: toPublicKey(STAKE_POOL_PROGRAM_ID),
        data: data,
    }));

    return instructions;
}
/* 
    Withdraw Pool
*/

export async function sendWithdrawSol(
    connection: Connection,
    wallet: WalletContextState,
    stakePoolAccount: StakePoolAccount,
    validatorListAccount: ValidatorListAccount,
    amount: number
) {
    if (!wallet.publicKey)
        return;

    const signers: Keypair[][] = [];
    const instructions: TransactionInstruction[][] = [];

    const withdraw = await setupWithdrawSol(
        connection,
        wallet.publicKey,
        stakePoolAccount,
        instructions,
        signers,
        amount
    );

    await sendTransaction(
        connection,
        wallet,
        instructions[0],
        signers[0],
    );

    return withdraw;

}

export async function setupWithdrawSol(
    connection: Connection,
    payer: PublicKey,
    stakePoolAccount: StakePoolAccount,
    overallInstructions: TransactionInstruction[][],
    overallSigners: Keypair[][],
    amount: number
) {
    const instructions: TransactionInstruction[] = [];
    const signers: Keypair[] = [];

    const stakePool = stakePoolAccount.pubkey;
    const poolMint = prettyPrintPublicKey(stakePoolAccount.account.data.poolMint);

    const poolTokenAccount = await addAssociatedTokenAccount(
        connection,
        payer,
        poolMint,
        instructions,
        signers
    );

    if (!poolTokenAccount)
        return Error();

    const tokenAccount = await connection.getTokenAccountBalance(poolTokenAccount);

    const lamportWithdrawAmount: number = amount * LAMPORTS_PER_SOL
    
    if (lamportWithdrawAmount > parseInt(tokenAccount.value.amount)) {
        throw Error();
    }

    let transferAuthority = new Keypair();
    signers.push(transferAuthority);

    instructions.push(Token.createApproveInstruction(
        TOKEN_PROGRAM_ID,
        poolTokenAccount,
        transferAuthority.publicKey,
        payer,
        [],
        lamportWithdrawAmount
    ));

    const withdrawAuthorityProgramAddress = await PublicKey.findProgramAddress(
        [stakePoolAccount.pubkey.toBuffer(), Buffer.from("withdraw")],
        stakePoolAccount.account.owner
    )

    // signers.push(withdrawAuthorityProgramAddress[0]);

    const withdraw  = await withdrawSol(
        stakePool,
        withdrawAuthorityProgramAddress[0],
        transferAuthority.publicKey,
        poolTokenAccount,
        prettyPrintPublicKey(stakePoolAccount.account.data.reserveStake),
        payer,
        prettyPrintPublicKey(stakePoolAccount.account.data.managerFeeAccount),
        poolMint,
        new BN(lamportWithdrawAmount),
        instructions,
        connection
    );

    overallInstructions.push([...instructions]);
    overallSigners.push(signers);

    return withdraw;
}

export async function withdrawSol(
    stakePoolAddress: PublicKey,
    poolWithdrawAuthority: PublicKey,
    userTransferAuthority: PublicKey,
    poolTokenAcocunt: PublicKey,
    reserveStakeAccount: PublicKey,
    lamportsTo: PublicKey,
    managerFeeAccount: PublicKey,
    poolMint: PublicKey,
    poolTokens: BN,
    instructions: TransactionInstruction[],
    connection: Connection
) {
    const data = Buffer.from(
        serialize(
            WITHDRAW_SOL_SCHEMA,
            new WithdrawSolSchema({
                amount: poolTokens
            }),
        )
    );
    const keys= [
        {
            pubkey: stakePoolAddress,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: poolWithdrawAuthority,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: userTransferAuthority,
            isSigner: true,
            isWritable: false,
        },
        {
            pubkey: poolTokenAcocunt,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: reserveStakeAccount,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: lamportsTo,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: managerFeeAccount,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: poolMint,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: SYSVAR_CLOCK_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: SYSVAR_STAKE_HISTORY_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: StakeProgram.programId,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
        },
    ];
    const recentBlockhash = await connection.getRecentBlockhash();
    const ctor: TransactionCtorFields = {
        recentBlockhash: recentBlockhash.blockhash
    }
    instructions.push(new TransactionInstruction(
        {
            keys,
            programId: toPublicKey(STAKE_POOL_PROGRAM_ID),
            data: data,
        })
    );

    return instructions;

}

/* 
    UPDATE POOL -- each epoch
*/

export const MAX_VALIDATORS_TO_UPDATE = 5;

export async function sendUpdateStakePool(
    connection: Connection,
    wallet: WalletContextState,
    stake_pool: StakePoolAccount,
    validatorList: ValidatorListAccount) 
{
    const signers: Keypair[][] = [];
    const instructions: TransactionInstruction[][] = [];

    const update = await updateStakePool(stake_pool, validatorList, false, instructions)

    await sendTransaction(
        connection,
        wallet,
        instructions[0],
        [],
    );

    await sendTransaction(
        connection,
        wallet,
        instructions[1],
        [],
    );

    return update;
}

export async function updateStakePool(
    stake_pool: StakePoolAccount,
    validatorList: ValidatorListAccount,
    no_merge: boolean,
    overallInstructions: TransactionInstruction[][]
) {

    let instructions: TransactionInstruction[] = [];
    let cleanupInstructions: TransactionInstruction[] = [];

    const voteAccounts: ValidatorStakeInfo[] = [];
    validatorList.account.data.validators.forEach(element => {
        voteAccounts.push(element);
    });

    // move to func
    const withdrawAuthorityProgramAddress = await PublicKey.findProgramAddress(
        [stake_pool.pubkey.toBuffer(), Buffer.from("withdraw")],
        stake_pool.account.owner
    )

    let i, j, temporary, chunk = 5;
    for (i = 0, j = voteAccounts.length; i < j; i += chunk){
        temporary = voteAccounts.slice(i, i + chunk);
        await update_validator_list_balance(
            stake_pool.pubkey, 
            withdrawAuthorityProgramAddress[0], 
            stake_pool.account.data.validatorList, 
            stake_pool.account.data.reserveStake,
            validatorList,
            temporary,
            i,
            no_merge,
            instructions);
    }

    // update stake pool balance
    update_stake_pool_balance(
        stake_pool.pubkey,
        withdrawAuthorityProgramAddress[0],
        stake_pool.account.data.validatorList,
        stake_pool.account.data.reserveStake,
        stake_pool.account.data.managerFeeAccount,
        stake_pool.account.data.poolMint,
        cleanupInstructions
    );
    // cleanup removed validator entries
    cleanup_removed_validator_entries(
        stake_pool.pubkey,
        stake_pool.account.data.validatorList,
        cleanupInstructions
    );

    overallInstructions[0] = instructions;
    overallInstructions[1] = cleanupInstructions;
}

export function cleanup_removed_validator_entries(
    stake_pool: PublicKey,
    validator_list_storage: PublicKey,
    instructions: TransactionInstruction[]
) {
    const data = Buffer.from(
        serialize(
            CLEANUP_REMOVED_VALIDATOR_ENTRIES,
            new CleanupRemovedValidatorEntries(),
        )
    );
    const keys = [
        {
            pubkey: stake_pool,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: decodePublicKey(validator_list_storage),
            isSigner: false,
            isWritable: true,
        },
    ];
    instructions.push(new TransactionInstruction({
        keys,
        programId: toPublicKey(STAKE_POOL_PROGRAM_ID),
        data: data,
    }));
}

export async function update_stake_pool_balance(
    stake_pool: PublicKey,
    withdraw_authority: PublicKey,
    validator_list_storage: PublicKey,
    reserve_stake: PublicKey,
    manager_fee_account: PublicKey,
    stake_pool_mint: PublicKey,
    instructions: TransactionInstruction[],
) {
    const data = Buffer.from(
        serialize(
            UPDATE_STAKE_POOL_BALANCE_SCHEMA,
            new UpdateStakePoolBalanceSchema(),
        )
    );
    const keys = [
        {
            pubkey: stake_pool,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: withdraw_authority,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: decodePublicKey(validator_list_storage),
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: decodePublicKey(reserve_stake),
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: decodePublicKey(manager_fee_account),
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: decodePublicKey(stake_pool_mint),
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
        }
    ];

    instructions.push(new TransactionInstruction({
        keys,
        programId: toPublicKey(STAKE_POOL_PROGRAM_ID),
        data: data,
    }));
}
export async function update_validator_list_balance(
    stake_pool: PublicKey,
    stake_pool_withdraw_authority: PublicKey,
    validator_list_address: PublicKey,
    reserve_stake: PublicKey,
    validator_list: ValidatorListAccount,
    validator_vote_accounts: ValidatorStakeInfo[],
    start_index: number,
    no_merge: boolean,
    instructions: TransactionInstruction[]
) {
    const data = Buffer.from(
        serialize(
            UPDATE_VALIDATOR_LIST_BALANCE_SCHEMA,
            new UpdateValidatorListBalanceSchema({
                start_index: start_index,
                no_merge: no_merge
            }),
        )
    );
    const keys = [
        {
            pubkey: stake_pool,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: stake_pool_withdraw_authority,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: decodePublicKey(validator_list_address),
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: decodePublicKey(reserve_stake),
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: SYSVAR_CLOCK_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: SYSVAR_STAKE_HISTORY_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: StakeProgram.programId,
            isSigner: false,
            isWritable: false,
        },
    ];

    validator_vote_accounts.forEach(async element => {
        // find stake program address
        const stakeProgramAddress = await PublicKey.findProgramAddress(
            [
                decodePublicKey(element.voteAccountAddress).toBuffer(),
                stake_pool.toBuffer()
            ],
            new PublicKey(STAKE_POOL_PROGRAM_ID)
        );
        // find transient stake program address
        // const transientStakeProgramAddress = new PublicKey("2CHTNxp6Mhns2yehVnxYv1EaKpEKK7byMiCLSGbbvyTi");
        const transientStakeProgramAddress = await PublicKey.findProgramAddress(
            [
                Buffer.from("transient"),
                decodePublicKey(element.voteAccountAddress).toBuffer(),
                stake_pool.toBuffer(),
                Buffer.from("0")
            ],
            new PublicKey(STAKE_POOL_PROGRAM_ID)
        );
        // const transientStakeProgramAddress = await PublicKey.createWithSeed()
        keys.push({
            pubkey: stakeProgramAddress[0],
            isSigner: false,
            isWritable: true,
        });
        keys.push({
            pubkey: transientStakeProgramAddress[0],
            isSigner: false,
            isWritable: true,
        });
    });

    instructions.push(new TransactionInstruction({
        keys,
        programId: toPublicKey(STAKE_POOL_PROGRAM_ID),
        data: data,
        })
    );

}
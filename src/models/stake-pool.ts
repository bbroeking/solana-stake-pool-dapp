import { AccountInfo, PublicKey } from "@solana/web3.js";
import * as schema from '../views/home/schema';

export class StakePoolAccounts {
    /**
     * Wrapper class for a stake pool.
     * Each stake pool has a stake pool account and a validator list account.
     */
    stakePool: StakePoolAccount;
    validatorList: ValidatorListAccount;
}
  
export interface StakePoolAccount {
    pubkey: PublicKey;
    account: AccountInfo<schema.StakePool>;
}
  
export interface ValidatorListAccount {
    pubkey: PublicKey;
    account: AccountInfo<schema.ValidatorList>;
}
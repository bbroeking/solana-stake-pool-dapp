import { MintInfo } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { prettyPrintPubKey } from "../components/StakePoolDisplay";
import { TokenAccount } from "../models";

const PubKeysInternedMap = new Map<string, PublicKey>();
export type StringPublicKey = string;
export const STAKE_POOL_PROGRAM_ID = "SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy";

export function toLamports(
    account?: TokenAccount | number,
    mint?: MintInfo,
): number {
    if (!account)
        return 0;
    const amount =
        typeof account === 'number' ? account : account.info.amount?.toNumber();

    const precision = Math.pow(10, mint?.decimals || 0);
    return Math.floor(amount * precision);
}

export const toPublicKey = (key: string | PublicKey) => {
    if (typeof key !== 'string') {
      return key;
    }
  
    let result = PubKeysInternedMap.get(key);
    if (!result) {
      result = new PublicKey(key);
      PubKeysInternedMap.set(key, result);
    }
  
    return result;
};

export function prettyPrintPublicKey(pubKey: PublicKey): PublicKey {
    return new PublicKey(prettyPrintPubKey(pubKey));
};
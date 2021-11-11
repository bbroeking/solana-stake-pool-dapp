import { Schema } from 'borsh';
import BN from 'bn.js';
import { Struct, Enum, PublicKey } from '@solana/web3.js';
export declare class Fee extends Struct {
    denominator: BN;
    numerator: BN;
}
export declare class AccountType extends Enum {
}
export declare class AccountTypeEnum extends Struct {
}
export declare enum AccountTypeKind {
    Uninitialized = "Uninitialized",
    StakePool = "StakePool",
    ValidatorList = "ValidatorList"
}
export declare class StakePool extends Struct {
    accountType: AccountType;
    manager: PublicKey;
    staker: PublicKey;
    depositAuthority: PublicKey;
    withdrawBumpSeed: number;
    validatorList: PublicKey;
    reserveStake: PublicKey;
    poolMint: PublicKey;
    managerFeeAccount: PublicKey;
    totalStakeLamports: BN;
    poolTokenSupply: BN;
    lastUpdateEpoch: BN;
    fee: Fee;
}
export declare class ValidatorList extends Struct {
    accountType: AccountType;
    maxValidators: number;
    validators: [ValidatorStakeInfo];
}
export declare class ValidatorStakeInfo extends Struct {
    active_stake_lamports: BN;
    transient_stake_lamports: BN;
    last_update_epoch: BN;
    transient_seed_suffix_start: BN;
    transient_seed_suffix_end: BN;
    status: StakeStatus;
    voteAccountAddress: PublicKey
}
export declare class StakeStatus extends Enum {
}
export declare class StakeStatusEnum extends Struct {
}
export declare enum StakeStatusKind {
    Active = "Active",
    DeactivatingTransient = "DeactivatingTransient",
    ReadyForRemoval = "ReadyForRemoval"
}
export declare class Lockup extends Struct {
    unix_timestamp: BN;
    epoch: BN;
    custodian: PublicKey;
}
export declare function addStakePoolSchema(schema: Schema): void;
//# sourceMappingURL=schema.d.ts.map
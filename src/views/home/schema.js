import { Struct, Enum, PublicKey } from '@solana/web3.js';
export class Fee extends Struct {
}
export class AccountType extends Enum {
}
export class AccountTypeEnum extends Struct {
}
export var AccountTypeKind;
(function (AccountTypeKind) {
    AccountTypeKind["Uninitialized"] = "Uninitialized";
    AccountTypeKind["StakePool"] = "StakePool";
    AccountTypeKind["ValidatorList"] = "ValidatorList";
})(AccountTypeKind || (AccountTypeKind = {}));
export class StakePool extends Struct {
}
export class ValidatorList extends Struct {
}
export class ValidatorStakeInfo extends Struct {
}
export class StakeStatus extends Enum {
}
export class StakeStatusEnum extends Struct {
}
export var StakeStatusKind;
(function (StakeStatusKind) {
    StakeStatusKind["Active"] = "Active";
    StakeStatusKind["DeactivatingTransient"] = "DeactivatingTransient";
    StakeStatusKind["ReadyForRemoval"] = "ReadyForRemoval";
})(StakeStatusKind || (StakeStatusKind = {}));
export class Lockup extends Struct {
}
export function addStakePoolSchema(schema) {
    /**
     * Borsh requires something called a Schema,
     * which is a Map (key-value pairs) that tell borsh how to deserialise the raw data
     * This function adds a new schema to an existing schema object.
     */
    schema.set(PublicKey, {
        kind: 'struct',
        fields: [['_bn', 'u256']],
    });
    schema.set(Fee, {
        kind: 'struct',
        fields: [
            ['denominator', 'u64'],
            ['numerator', 'u64'],
        ],
    });
    schema.set(Lockup, {
        kind: 'struct',
        fields: [
            ['unix_timestamp', 'u64'],
            ['epoch', 'u64'],
            ['custodian', PublicKey]
        ]
    });
    schema.set(AccountType, {
        kind: 'enum',
        field: 'enum',
        values: [
            // if the account has not been initialized, the enum will be 0
            [AccountTypeKind.Uninitialized, AccountTypeEnum],
            [AccountTypeKind.StakePool, AccountTypeEnum],
            [AccountTypeKind.ValidatorList, AccountTypeEnum],
        ],
    });
    schema.set(AccountTypeEnum, { kind: 'struct', fields: [] });
    schema.set(StakePool, {
        kind: 'struct',
        fields: [
            ['accountType', AccountType],
            ['manager', PublicKey],
            ['staker', PublicKey],
            ['depositAuthority', PublicKey],
            ['withdrawBumpSeed', 'u8'],
            ['validatorList', PublicKey],
            ['reserveStake', PublicKey],
            ['poolMint', PublicKey],
            ['managerFeeAccount', PublicKey],
            ['tokenProgramId', PublicKey],
            ['totalStakeLamports', 'u64'],
            ['poolTokenSupply', 'u64'],
            ['lastUpdateEpoch', 'u64'],
            ['lockup', Lockup],
            ['fee', Fee],
            ['nextEpochFee', Fee],
            ['preferred_deposit_validator_vote_address', PublicKey],
            ['preferred_withdraw_validator_vote_address', PublicKey],
            ['stake_deposit_fee', Fee],
            ['stake_withdrawal_fee', Fee],
            ['next_stake_withdrawal_fee', Fee],
            ['stake_referral_fee', 'u8'],
            ['sol_deposit_authority', PublicKey],
            ['sol_deposit_fee', Fee],
            ['sol_referral_fee', 'u8'],
            ['sol_withdraw_authority', PublicKey],
            ['sol_withdrawal_fee', Fee],
            ['next_sol_withdrawal_fee', Fee],
            ['last_epoch_pool_token_supply', 'u64'],
            ['last_epoch_total_lamports', 'u64']
        ],
    });
    schema.set(ValidatorList, {
        kind: 'struct',
        fields: [
            ['accountType', AccountType],
            ['maxValidators', 'u32'],
            ['validators', [ValidatorStakeInfo]],
        ],
    });
    schema.set(StakeStatus, {
        kind: 'enum',
        field: 'enum',
        values: [
            [StakeStatusKind.Active, StakeStatusEnum],
            [StakeStatusKind.DeactivatingTransient, StakeStatusEnum],
            [StakeStatusKind.ReadyForRemoval, StakeStatusEnum],
        ],
    });
    schema.set(StakeStatusEnum, { kind: 'struct', fields: [] });
    schema.set(ValidatorStakeInfo, {
        kind: 'struct',
        fields: [
            ['active_stake_lamports', 'u64'],
            ['transient_stake_lamports', 'u64'],
            ['last_update_epoch', 'u64'],
            ['transient_seed_suffix_start', 'u64'],
            ['transient_seed_suffix_end', 'u64'],
            ['status', StakeStatus],
            ['voteAccountAddress', PublicKey],
        ],
    });
}

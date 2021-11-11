import BN from "bn.js";

export class DepositSolSchema {
    instruction: number = 14;
    amount: BN

    constructor(args: { amount: BN }) {
        this.amount = args.amount;
    }
}

export class WithdrawSolSchema {
    instruction: number = 16;
    amount: BN;
    constructor(args: { amount: BN }) {
        this.amount = args.amount;
    }
}

export class UpdateValidatorListBalanceSchema {
    instruction: number = 6;
    start_index: number;
    no_merge: boolean

    constructor(args: { start_index: number, no_merge: boolean }) {
        this.start_index = args.start_index;
        this.no_merge = args.no_merge;
    }
}

export class UpdateStakePoolBalanceSchema {
    instruction: number = 7;
}

export class CleanupRemovedValidatorEntries {
    instruction: number = 8;
}

export const DEPOSIT_SOL_SCHEMA = new Map<any, any>([
    [
        DepositSolSchema,
      {
        kind: 'struct',
        fields: [
            ['instruction', 'u8'],
            ['amount', 'u64'],
        ],
      },
    ],
]);

export const WITHDRAW_SOL_SCHEMA = new Map<any, any>([
    [
        WithdrawSolSchema,
      {
        kind: 'struct',
        fields: [
            ['instruction', 'u8'],
            ['amount', 'u64'],
        ],
      },
    ],
]);

export const UPDATE_VALIDATOR_LIST_BALANCE_SCHEMA = new Map<any, any>([
    [
        UpdateValidatorListBalanceSchema,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['start_index', 'u32'],
                ['no_merge', 'u8']
            ]
        }
    ]
]);

export const UPDATE_STAKE_POOL_BALANCE_SCHEMA = new Map<any, any>([
    [
        UpdateStakePoolBalanceSchema,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
            ]
        }
    ]
]);

export const CLEANUP_REMOVED_VALIDATOR_ENTRIES = new Map<any, any>([
    [
        CleanupRemovedValidatorEntries,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
            ]
        }
    ]
]);
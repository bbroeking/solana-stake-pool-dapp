import React from 'react'
import { Button, Space, Table } from 'antd'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { StakePoolAccount, StakePoolAccounts, ValidatorListAccount } from '../../models/stake-pool';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '../../contexts/connection';
import { sendDepositSol, sendUpdateStakePool, sendWithdrawSol, updateStakePool } from '../../actions/stake-pool';
import { StakePool, ValidatorList } from '../../views/home/schema';

export interface StakePoolProps {
    stakeValidatorCombo: StakePoolAccounts[] | undefined,
}

/**
 * Helper function to pretty print a schema.PublicKey
 * Pretty prints a PublicKey in base58 format */
export function prettyPrintPubKey(pubKey: PublicKey): string {
    return new PublicKey(
      new PublicKey(pubKey.toBuffer()).toBytes().reverse(),
    ).toString();
}

export function decodePublicKey(pubKey: PublicKey): PublicKey {
    return new PublicKey(
      new PublicKey(pubKey.toBuffer()).toBytes().reverse(),
    );
}

const StakePoolDisplay = (props: StakePoolProps) => {
    const connection = useConnection();
    const wallet = useWallet();
    const onStake = async (stakePool: StakePoolAccount) => {
        sendDepositSol(connection, wallet, stakePool, 1)
    }
    const onWithdrawStake = async (stakePool: StakePoolAccount, validatorList: ValidatorListAccount) => {
        sendWithdrawSol(connection, wallet, stakePool, validatorList, 1);
    }

    const onUpdatePool = async (stakePool: StakePoolAccount, validatorList: ValidatorListAccount) => {
        sendUpdateStakePool(connection, wallet, stakePool, validatorList);
    }
    const columns = [
        {
            title: 'Public Key',
            render: (record: StakePoolAccounts) => <Space>{ record.stakePool.pubkey.toString() }</Space>
        },
        {
            title: 'Account Type',
            render: (record: StakePoolAccounts) => <Space>{record.stakePool.account.data.accountType.enum}</Space>
        },
        {
            title: 'Reserve Stake',
            render: (record: StakePoolAccounts) => <Space>{ prettyPrintPubKey(record.stakePool.account.data.reserveStake) }</Space>
        },
        {
            title: 'Deposit Authority',
            render: (record: StakePoolAccounts) => <Space>{ prettyPrintPubKey(record.stakePool.account.data.depositAuthority) }</Space>
        },
        {
            title: 'Validator List PubKey',
            render: (record: StakePoolAccounts) => <Space>{ prettyPrintPubKey(record.stakePool.account.data.validatorList) }</Space>
        },
        {
            title: 'Manager Fee PubKey',
            render: (record: StakePoolAccounts) => <Space>{ prettyPrintPubKey(record.stakePool.account.data.managerFeeAccount) }</Space>
        },
        {
            title: 'Owner PubKey',
            render: (record: StakePoolAccounts) => <Space>{ record.stakePool.account.owner.toString() }</Space>
        },
        {
            title: 'Pool Mint PubKey',
            render: (record: StakePoolAccounts) => <Space>{ prettyPrintPubKey(record.stakePool.account.data.poolMint) }</Space>
        },
        {
            title: 'Total Stake Lamports',
            render: (record: StakePoolAccounts) => <Space>{ record.stakePool.account.data.totalStakeLamports.toNumber() / LAMPORTS_PER_SOL }</Space>
        },
        {
            title: 'Pool Token Supply',
            render: (record: StakePoolAccounts) => <Space>{ record.stakePool.account.data.poolTokenSupply.toNumber() / LAMPORTS_PER_SOL }</Space>
        },
        {
            title: 'Fee',
            render: (record: StakePoolAccounts) => <Space>{ record.stakePool.account.data.fee.numerator.toNumber() / record.stakePool.account.data.fee.denominator.toNumber() }</Space>
        },
        {
            title: 'Vote Accounts',
            render: (record: StakePoolAccounts) => <Space>{ 
                record.validatorList.account.data.validators.map((validators) => {
                    return <div>{ prettyPrintPubKey(validators.voteAccountAddress) }</div>
                })
            }</Space>
        },
        {
            title: 'Max Validators',
            render: (record: StakePoolAccounts) => <Space>{ record.validatorList.account.data.maxValidators }</Space>
        },
        {
            title: 'Stake',
            render: (record: StakePoolAccounts) => (
                <Space>        
                    {/* <Link 
                        to={{
                            pathname: `/stake/${record.stakePool.account.data.validatorList.toString()}`,
                            state: { 
                                validator: record.stakePool.account.data.validatorList,
                                comboAccounts: props.stakeValidatorCombo
                            }
                        }}
                    > */}
                        <Button onClick={ () => onStake(record.stakePool) }>Stake</Button>
                        <Button onClick={ () => onUpdatePool(record.stakePool, record.validatorList) }>Update Pool</Button>
                        <Button onClick= { () => onWithdrawStake(record.stakePool, record.validatorList)}> Withdraw Stake </Button>
                    {/* </Link> */}
                </Space>
            )
        }
      ];

    return (
        <div>
            <Table dataSource={props.stakeValidatorCombo} columns={columns} rowKey="name"></Table>
        </div>
    )
}


export default StakePoolDisplay

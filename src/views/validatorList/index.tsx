import { Connection, LAMPORTS_PER_SOL, PublicKey, SOLANA_SCHEMA } from '@solana/web3.js';
import { Card } from 'antd';
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router';
import { prettyPrintPubKey } from '../../components/StakePoolDisplay';
import { useConnection } from '../../contexts/connection';
import * as schema from '../home/schema.js';
import { ValidatorList } from '../home/schema.js';

export interface Params {
    validator: string,
}
const ValidatorView = () => {
    schema.addStakePoolSchema(SOLANA_SCHEMA);
    const params: Params = useParams();
    const connection = useConnection();
    const [hasValidator, setHasValidator] = useState<boolean>(false);
    const [validatorAccounts, setValidatorAccounts] = useState<ValidatorList[]>();

    async function getValidatorAccounts(
        connection: Connection,
        pubKey: PublicKey,
    ): Promise<ValidatorList[] | undefined> {
        let decodedData;
        const accountInfo = await connection.getAccountInfo(pubKey);
        if(accountInfo)
            decodedData = schema.ValidatorList.decodeUnchecked(accountInfo?.data);
        return [decodedData];
    }
    
    useEffect(() => {
        (async () => {
            let validatorPubKey = new PublicKey(params.validator);
            let ppPubKey = prettyPrintPubKey(validatorPubKey);
            let validatorAccounts = await getValidatorAccounts(connection, new PublicKey(ppPubKey));
            setValidatorAccounts(validatorAccounts as ValidatorList[]);
            setHasValidator(true);
        })()  
    }, [connection]);

    return (
        <Card>
            <p>{hasValidator && validatorAccounts![0].maxValidators}</p>
            { hasValidator && validatorAccounts![0].validators.map((validator) => {
                return <div>
                    <p>{prettyPrintPubKey(validator.voteAccountAddress)}</p>
                    <p>{validator.status.enum.toString() }</p>
                    <p>{validator.active_stake_lamports.toNumber() / LAMPORTS_PER_SOL}</p>
                    <p>{validator.last_update_epoch.toNumber()}</p>
                </div>
            })}
        </Card>
    )
}

export default ValidatorView;

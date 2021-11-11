import { WalletMultiButton } from "@solana/wallet-adapter-ant-design";
import { useWallet } from "@solana/wallet-adapter-react";
import { SOLANA_SCHEMA, Connection, PublicKey } from "@solana/web3.js";
import { Col, Row } from "antd";
import React, { useEffect, useState } from "react";
import StakePoolDisplay, { prettyPrintPubKey } from "../../components/StakePoolDisplay";
import { useConnection, useConnectionConfig } from "../../contexts/connection";
import { StakePoolAccount, StakePoolAccounts, ValidatorListAccount } from "../../models/stake-pool";
import * as schema from './schema.js';

export const HomeView = () => {
  const connection: Connection = useConnection();
  const { tokenMap } = useConnectionConfig();

  schema.addStakePoolSchema(SOLANA_SCHEMA);
  const [stakePoolAccounts, setStakePoolAccounts] = useState<StakePoolAccount[]>();
  const [validatorAccounts, setValidatorAccounts] = useState<ValidatorListAccount[]>();
  const [stakeValidatorCombo, setStakeValidatorCombo] = useState<StakePoolAccounts[]>();
  const wallet = useWallet();
  
  /**
   * Retrieves all StakePool and ValidatorList accounts that are running a particular StakePool program.
   * @param connection: An active web3js connection.
   * @param stakePoolProgramAddress: The public key (address) of the StakePool program.
   */
  async function getStakePoolAccounts(
    connection: Connection,
    stakePoolProgramAddress: PublicKey,
  ): Promise<(StakePoolAccount | ValidatorListAccount)[] | undefined> {
    try {
      let response = await connection.getProgramAccounts(
        stakePoolProgramAddress,
      );

      const stakePoolAccounts = response.map(a => {
        let decodedData;

        if (a.account.data.readUInt8(0) === 1) {
          try {
            decodedData = schema.StakePool.decodeUnchecked(a.account.data);
          } catch (error) {
            console.log('Could not decode StakeAccount. Error:', error);
            decodedData = undefined;
          }
        } else if (a.account.data.readUInt8(0) === 2) {
          try {
            decodedData = schema.ValidatorList.decodeUnchecked(a.account.data);
          } catch (error) {
            console.log('Could not decode ValidatorList. Error:', error);
            decodedData = undefined;
          }
        } else {
          console.error(
            `Could not decode. StakePoolAccount Enum is ${a.account.data.readUInt8(0)}, expected 1 or 2!`,
          );
          decodedData = undefined;
        }

        return {
          pubkey: a.pubkey,
          account: {
            data: decodedData,
            executable: a.account.executable,
            lamports: a.account.lamports,
            owner: a.account.owner,
          },
        };
      });

      return stakePoolAccounts;
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    (async () => {
      const pubKey = new PublicKey("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy");
      const accounts = await getStakePoolAccounts(connection, pubKey);
      const stakeAccounts: StakePoolAccount[] = accounts?.filter(account => account.account.data?.accountType.enum == 'StakePool') as StakePoolAccount[];
      const validatorAccounts: ValidatorListAccount[] = accounts?.filter(account => account.account.data?.accountType.enum == 'ValidatorList') as ValidatorListAccount[];
      const stakePoolAccounts: StakePoolAccounts[] = stakeAccounts.map((stake) => 
        {
          let validator = validatorAccounts.find((validatorList) => prettyPrintPubKey(stake.account.data.validatorList) === validatorList.pubkey.toString());
          if (validator) {
            return {
              stakePool: stake,
              validatorList: validator
            }
          }
        }
      ) as StakePoolAccounts[];
      setStakePoolAccounts(stakeAccounts);
      setValidatorAccounts(validatorAccounts);
      setStakeValidatorCombo(stakePoolAccounts);
    })()

  }, [connection]);


  return (
    <Row gutter={[16, 16]} align="middle">
      <Col span={24}>
          <StakePoolDisplay stakeValidatorCombo={stakeValidatorCombo}></StakePoolDisplay>
      </Col>
      <Col span={12}>
        <WalletMultiButton type="ghost" />
      </Col>
    </Row>


  );
};

import { readFileSync } from "fs";
import path from "path";
import {
  TransactionHash,
  GenLayerClient,
  DecodedDeployData,
  GenLayerChain,
} from "genlayer-js/types";
import { localnet } from "genlayer-js/chains";

// Constructor values: platform fee in basis points (100 = 1%), the appeal window
// in seconds, and how long a claim may wait for judging before anyone can release it.
const FEE_BPS = 100n;
const APPEAL_WINDOW_SECONDS = 300n;
const JUDGE_DEADLINE_SECONDS = 3600n;

export const isSuccessfulDeploymentReceipt = (receipt: {
  status?: number | string;
  statusName?: string;
}): boolean => {
  const numericStatus = Number(receipt.status);
  return (
    numericStatus === 5 ||
    numericStatus === 7 ||
    receipt.statusName === "ACCEPTED" ||
    receipt.statusName === "FINALIZED"
  );
};

export default async function main(client: GenLayerClient<any>) {
  const filePath = path.resolve(process.cwd(), "contracts/fixproof.py");

  try {
    const contractCode = new Uint8Array(readFileSync(filePath));

    await client.initializeConsensusSmartContract();

    const deployTransaction = await client.deployContract({
      code: contractCode,
      args: [FEE_BPS, APPEAL_WINDOW_SECONDS, JUDGE_DEADLINE_SECONDS],
    });

    const receipt = await client.waitForTransactionReceipt({
      hash: deployTransaction as TransactionHash,
      waitUntil: "decided",
      retries: 200,
    });

    if (!isSuccessfulDeploymentReceipt(receipt)) {
      throw new Error(`Deployment failed. Receipt: ${JSON.stringify(receipt)}`);
    }

    const deployedContractAddress =
      (client.chain as GenLayerChain).id === localnet.id
        ? receipt.data?.contract_address
        : (receipt.txDataDecoded as DecodedDeployData)?.contractAddress;

    if (!deployedContractAddress) {
      throw new Error("Deployment receipt did not contain a contract address");
    }

    console.log(`Contract deployed at address: ${deployedContractAddress}`);
  } catch (error) {
    throw new Error(`Error during deployment: ${error}`);
  }
}

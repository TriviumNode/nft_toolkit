const csv = require('csv-parser');
const fs = require('fs');
var crypto = require('crypto');
require('dotenv').config();
const secureRandom = require("secure-random");
const { EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey } = require("secretjs");
const setEnv = require("./setEnv");

const customFees = {
    upload: {
        amount: [{ amount: "1000000", denom: "uscrt" }],
        gas: "4000000",
    },
    init: {
        amount: [{ amount: "50000", denom: "uscrt" }],
        gas: "200000",
    }
}

var initMsg = {
    name:"My Token",
    symbol:"MYTOKN",
    decimals:6,
    prng_seed: Buffer.from(secureRandom(32, { type: "Uint8Array" })).toString("base64"),
    initial_balances:[
        {
            address: process.env.ACCT_ADDRESS,
            amount: "10000000000000"
        }
    ],
    config:{
        public_total_supply: true,
        enable_deposit: false,
        enable_redeem: false,
        enable_mint: false,
        enable_burn: false
    }
};

const main = async () => {
    const signingPen = await Secp256k1Pen.fromMnemonic(process.env.MNEMONIC);
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
    const accAddress = pubkeyToAddress(pubkey, 'secret');
    const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();

    const client = new SigningCosmWasmClient(
        process.env.REST_URL,
        accAddress,
        (signBytes) => signingPen.sign(signBytes),
        txEncryptionSeed, customFees
    );

    console.log(`Wallet address: ${accAddress}`);

    // Upload the SNIP24 wasm
    const wasm = fs.readFileSync("contracts/snip24.wasm");
    console.log('Uploading wasm...')
    const uploadReceipt = await client.upload(wasm, {});

    console.log('Success!')

    // Get the code ID from the receipt
    const codeId = uploadReceipt.codeId;
    console.log('Code ID: ', codeId);

    // get contract hash
    const contractCodeHash = await client.restClient.getCodeHashByCodeId(codeId);
    console.log(`Code hash: ${contractCodeHash}`);

    //instantiate contract
    console.log('Instantiating token contract...')
    const contract = await client.instantiate(codeId, initMsg, process.env.TOKEN_LABEL);

    console.log("Success!")
    console.log(`Token address: ${contract.contractAddress}`);

    if (Boolean(process.env.UPDATE_ENV)){
        setEnv.setEnvValue('TOKEN_ADDR', contract.contractAddress)
        setEnv.setEnvValue('TOKEN_CODE_HASH', contractCodeHash)
    }
}
  
main().then(resp => {
    console.log("Done.");
}).catch(err => {
    if (err.message.includes("contract account already exists")){
        console.error(`ERROR: Contract label ${process.env.TOKEN_LABEL} already exists on this chain. Change the TOKEN_LABEL in .env`);
    } else if (err.message.includes("timed out waiting for tx to be included in a block")) {
        console.error("ERROR: Timed out waiting for TX to be processed. Please try again or check an explorer for the code-id or address (depending which step it failed on)");
    } else {
        console.error(err);
    }
})
const csv = require('csv-parser');
const fs = require('fs');
var crypto = require('crypto');
require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey
  } = require("secretjs");
const secureRandom = require("secure-random");
const setEnv = require("./setEnv");

const customFees = {
    upload: {
        amount: [{ amount: "1250000", denom: "uscrt" }],
        gas: "5000000",
    },
    init: {
        amount: [{ amount: "50000", denom: "uscrt" }],
        gas: "200000",
    }
}

const initMsg = {
    name: "My-Collection",
    symbol: "MYNFT",
    entropy: Buffer.from(secureRandom(32, { type: "Uint8Array" })).toString("base64"),
    snip20_address: process.env.TOKEN_ADDR,
    snip20_hash: process.env.TOKEN_CODE_HASH,
    royalty_info: {
        decimal_places_in_rates: 4,
        royalties: [
            {
                recipient: process.env.ACCT_ADDRESS,
                rate: 0050
            },{
                recipient: "secret13fqtu0lxsvn8gtlf3mz5kt75spxv93ssa6vecf",
                rate: 0050
            }
        ]
    },
    mint_funds_distribution_info: {
        decimal_places_in_rates: 4,
        royalties: [
            {
                recipient: process.env.ACCT_ADDRESS,
                rate: 10000
            }
        ]
    },
    config: {
        public_token_supply: true,
        public_owner: false,
        enable_sealed_metadata: false,
        unwrapped_metadata_is_private: true,
        minter_may_update_metadata: false,
        owner_may_update_metadata: false,
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

    console.log(`Wallet address: ${accAddress}`)

    // Upload the wasm of the random minting SNIP721
    const wasm = fs.readFileSync("contracts/snip721-random-mint.wasm");
    console.log('Uploading wasm...')
    const uploadReceipt = await client.upload(wasm, {});

    console.log('Success!')

    // Get the code ID from the receipt
    const codeId = uploadReceipt.codeId;
    console.log('Code ID: ', codeId);

    // contract hash, useful for contract composition
    const contractCodeHash = await client.restClient.getCodeHashByCodeId(codeId);
    console.log(`Code hash: ${contractCodeHash}`);

    //instantiate NFT contract
    console.log('Instantiating NFT contract...')
    const contract = await client.instantiate(codeId, initMsg, process.env.NFT_LABEL);

    console.log("Success!")
    console.log(`NFT address: ${contract.contractAddress}`);

    if (Boolean(process.env.UPDATE_ENV)){
        setEnv.setEnvValue('NFT_ADDR', contract.contractAddress)
        setEnv.setEnvValue('NFT_CODE_HASH', contractCodeHash)
    }
}
  
main().then(resp => {
    console.log("Done: ",resp);
}).catch(err => {
    if (err.message.includes("contract account already exists")){
        console.error(`ERROR: Contract label ${process.env.NFT_LABEL} already exists on this chain. Change the NFT_LABEL in .env`);
    } else if (err.message.includes("timed out waiting for tx to be included in a block")) {
        console.error("ERROR: Timed out waiting for TX to be processed. Please try again or check an explorer for the code-id or address (depending which step it failed on)");
    } else {
        console.error(err);
    }
})
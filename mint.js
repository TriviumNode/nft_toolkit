require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey, logs
  } = require("secretjs");
const textEncoding = require('text-encoding');
const TextDecoder = textEncoding.TextDecoder;
//
const customFees = {
    exec: {
        amount: [{ amount: "2000000", denom: "uscrt" }],
        gas: "8000000",
    }
}

const nftAddress = process.env.NFT_ADDR;
const tokenAddress = process.env.TOKEN_ADDR;

const mintMsg = {
    receive_mint: {}
};    

const sendMsg = {
    send: {
        amount:"10000000",
        recipient: nftAddress,
        msg: Buffer.from(JSON.stringify(mintMsg)).toString('base64')        
    }
}

const main = async () => {
    const signingPen = await Secp256k1Pen.fromMnemonic(process.env.MNEMONIC);
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
    const accAddress = pubkeyToAddress(pubkey, 'secret');
    const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
    const enigmaUtils = new EnigmaUtils(process.env.RESTURL, txEncryptionSeed);

    const client = new SigningCosmWasmClient(
        process.env.REST_URL,
        accAddress,
        (signBytes) => signingPen.sign(signBytes),
        txEncryptionSeed, customFees
    );

    console.log(`Wallet address = ${accAddress}`)

    response = await client.execute(tokenAddress, sendMsg);
    response.data = JSON.parse(new TextDecoder().decode(response.data));
    console.log(response);

    //get full TX with logs from REST
    let full = await client.restClient.txById(response.transactionHash);

    //decode response data to plain text
    full.data = JSON.parse(new TextDecoder().decode(full.data));

    let logs = {};
    full.logs[0].events[1].attributes.map((obj) => { logs[obj.key.trim()] = obj.value.trim() });

    //get ID of the NFT you minted from TX logs, no query required!
    console.log("Minted ID: ", logs.minted);
}

main().then(resp => {
    console.log("Done.");
}).catch(err => {
    console.log(err);
})

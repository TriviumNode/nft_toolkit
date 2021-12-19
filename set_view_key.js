require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey
  } = require("secretjs");
const textEncoding = require('text-encoding');
const TextDecoder = textEncoding.TextDecoder;

const nftAddress = process.env.NFT_ADDR;

const keyMsg = {
    set_viewing_key: {
        key: process.env.VIEW_KEY
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
        txEncryptionSeed
    );

    console.log(`Wallet address = ${accAddress}`)

    response = await client.execute(nftAddress, keyMsg);
    response.data = JSON.parse(new TextDecoder().decode(response.data));
    console.log(response);
}

main().then(resp => {
    console .log("Done.");
}).catch(err => {
    if (err.message.includes("timed out waiting for tx to be included in a block")) {
        console.error("ERROR: Timed out waiting for TX to be processed. The TX is in the mempool and will likely be processed soon, check an explorer to confirm.");
    } else {
        console.error(err);
    }
})

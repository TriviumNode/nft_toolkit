const csv = require('csv-parser');
const fs = require('fs');
var crypto = require('crypto');
require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey
  } = require("secretjs");

function pad(num, size) {
    var s = "000" + num;
    return s.substr(s.length-size);
}

const customFees = {
    exec: {
        amount: [{ amount: "2000000", denom: "uscrt" }],
        gas: "8000000",
    }
}

//empty pre-load handle message
var data = {
    pre_load: {
        new_data: []
    }
};



fs.createReadStream('data/1000punks.csv')
  .pipe(csv())
  .on('data', (row) => {

    //pad ID with leading 0's (123 => 0123)
    let fullid = pad(row.id, 4);

    //setup data for single-item in collection
    let singleItemData = {
        id: fullid,
        img_url: `https://www.larvalabs.com/public/images/cryptopunks/${fullid}.png`,
        priv_img_url: `https://www.larvalabs.com/public/images/cryptopunks/${fullid}.png`,
        attributes: row.accessories.trim().split("/", 10).map(x => {
            return({
                trait_type: "Accessory",
                value: x
            });
        }),
        priv_attributes: [{
            trait_type: "Secret Trait",
            value: "Private Value"
        }],
        priv_key: "abc123"
    }

    //add the single-item to new_data array
    data.pre_load.new_data.push(singleItemData);

  })
  .on('end', async() => {
    console.log('CSV file successfully processed');

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

    console.log(`Wallet address = ${accAddress}`)

    //execute pre-load handle function
    response = await client.execute(process.env.NFT_ADDR, data);
    console.log(response);
});


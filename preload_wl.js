const csv = require('csv-parser');
const fs = require('fs');
const { EnigmaUtils, Secp256k1Pen, pubkeyToAddress, encodeSecp256k1Pubkey, BroadcastMode } = require("secretjs");
const { AsyncClient } = require('./utils/asyncClient.js')
const { Bech32 } = require("@iov/encoding");

require('dotenv').config();

const customFees = {
    exec: {
        amount: [{ amount: "25000", denom: "uscrt" }],
        gas: "100000",
    }
}

function isValidAddress(address) {
    try {
      const { prefix, data } = Bech32.decode(address);
      if (prefix !== "secret") {
        return false;
      }
      return data.length === 20;
    } catch {
      return false;
    }
}

function csvJSONWL(csv){
    //console.log(csv)
    var lines=csv.split("\r\n");
    var result = [];
  
    // NOTE: If your columns contain commas in their values, you'll need
    // to deal with those before doing the next step 
    // (you might convert them to &&& or something, then covert them back later)
    // jsfiddle showing the issue https://jsfiddle.net/
    var headers=lines[0].split(",");
    for(var i=1;i<lines.length;i++){
        
        var obj = {};
        var currentline=lines[i].split(",");
        
        for(var j=0;j<headers.length;j++){
            obj[headers[j]] = currentline[j];
        }

        if (obj['Wallets for W/L'] && obj['Wallets for W/L'].includes('secret')){
            //result.push(obj);
            if (isValidAddress(obj['Wallets for W/L'].trim())){
                result.push(obj['Wallets for W/L'].trim());
            } else {
                console.log(`Address ${obj['Wallets for W/L'].trim()} is invalid`)
            }
        }
    }
  
    return result; //JavaScript object
    //return JSON.stringify(result); //JSON
}

const wlData = fs.readFileSync('data/whitelist.csv', 'utf8');
const wlAry = csvJSONWL(wlData);
console.log("Whitelist Address: ", wlAry.length)

//empty pre-load handle message
var data = {
    load_whitelist: {
        whitelist: wlAry
    }
};

main = async() =>{
    const signingPen = await Secp256k1Pen.fromMnemonic(process.env.MNEMONIC);
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
    const accAddress = pubkeyToAddress(pubkey, 'secret');
    const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
    
    const client = new AsyncClient(
        process.env.REST_URL,
        accAddress,
        (signBytes) => signingPen.sign(signBytes),
        txEncryptionSeed, customFees, BroadcastMode.Sync
    );

    console.log(`Wallet address = ${accAddress}`)

    //execute pre-load handle function
    response = await client.execute(process.env.NFT_ADDR, data);
    console.log(response);
    if (response.code) throw response.raw_log;

    //get full TX with logs from REST
    let full = await client.checkTx(response.transactionHash);
    if (full.code) throw full.raw_log;

    //decode response data to plain text
    if (full.data.length){
        full.data = JSON.parse(new TextDecoder().decode(full.data));
    }

    let logs = {};
    full.logs[0].events[1].attributes.map((obj) => { logs[obj.key.trim()] = obj.value.trim() });

    console.log(full);
}

main();
 
const { EnigmaUtils, Secp256k1Pen, pubkeyToAddress, encodeSecp256k1Pubkey, BroadcastMode } = require("secretjs");
const { AsyncClient } = require('./utils/asyncClient.js')

require('dotenv').config();

const deactivateMsg = {
  deactivate_whitelist : { }
}

const main = async () => {
  const signingPen = await Secp256k1Pen.fromMnemonic(process.env.MNEMONIC);
  const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
  const accAddress = pubkeyToAddress(pubkey, 'secret');
  const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
  const enigmaUtils = new EnigmaUtils(process.env.RESTURL, txEncryptionSeed);

  const client = new AsyncClient(
      process.env.REST_URL,
      accAddress,
      (signBytes) => signingPen.sign(signBytes),
      txEncryptionSeed,
      BroadcastMode.sync
  );

  console.log(`Wallet address = ${accAddress}`)

  response = await client.asyncExecute(process.env.NFT_ADDR, deactivateMsg);
  console.log(response);

}

main().then(resp => {
  console.log("Done");
}).catch(err => {
  console.log(err);
})

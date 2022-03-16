const { SigningCosmWasmClient } = require('secretjs');
const retry = require('async-await-retry');
const textEncoding = require('text-encoding');
const TextDecoder = textEncoding.TextDecoder;
//const encoding_1 = require("@iov/encoding");

const sleep = duration => new Promise(res => setTimeout(res, duration));

class AsyncClient extends SigningCosmWasmClient {
    asyncExecute = async (
        contractAddress,
        handleMsg,
        memo = "",
        transferAmount = [],
        fee = [],
    ) => {
        let tx;
        const key = Object.keys(handleMsg)[0];

        try {
            tx = await this.execute(contractAddress, handleMsg);
        } catch (e) {
            console.error(`failed to broadcast tx: ${e}`);
            throw `Failed to broadcast transaction ${e}`;
        }
    
        try {
            await sleep(5000);
            const res = await retry(
                () => {
                return this.restClient.txById(tx.transactionHash);
                },
                null,
                { retriesMax: 5, interval: 6000 },
            );
    
        return {
            ...res,
            transactionHash: tx.transactionHash,
        };
        } catch (e) {
            let error = `Timed out while waiting for transaction ${e}`;
            throw error;
        }
    };

    //convert tx logs into key-value pairs
    processLogs = (tx) => {
        if (tx.logs.length){
            let logs = {};
            console.log(tx)
            tx.logs[0].events[1].attributes.map((obj) => { logs[obj.key.trim()] = obj.value.trim() });
            tx.kv_logs=logs;
        }
        return tx;
    }

    //poll for if TX hash has been processed
    checkTx = async(txHash, interval=500, retries=5) => {
        try {
            await sleep(3000);
            let res = await retry(
                () => {
                return this.restClient.txById(txHash);
                },
                null,
                { retriesMax: retries, interval: interval },
            );

            if (res.code){
                return {
                    ...res,
                    transactionHash: txHash,
                }; 
            }
            
            let data=this.decodeResponse(res);
            data=this.processLogs(data);

            return {
                ...data,
                transactionHash: txHash,
            };

        } catch (e) {
            throw(`Timed out while waiting for transaction: ${e}`)
            //let error = new CustomError(`Timed out while waiting for transaction`);
            //error.txHash = tx.transactionHash;
            //throw e;
        }
    }

  decodeResponse = (tx) => {
    if (new TextDecoder().decode(tx.data)){
      tx.data = JSON.parse(new TextDecoder().decode(tx.data));
    }

    return tx;
  }
}

module.exports = {
    sleep, AsyncClient
}
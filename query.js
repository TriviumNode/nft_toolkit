 
require('dotenv').config();
const { CosmWasmClient } = require("secretjs");

let nftAddress = process.env.NFT_ADDR

const info_query = {
  contract_info : {}
};

const minted_query = {
  num_tokens : {}
};

const my_tokens_query = {
  tokens: {
    owner: process.env.ACCT_ADDRESS,
    //viewer: {
      //address: process.env.ACCT_ADDRESS,
      viewing_key: process.env.VIEW_KEY
    //}
  }
};

const all_tokens_query = {
  all_tokens: {
    viewer: {
      address: process.env.ACCT_ADDRESS,
      viewing_key: process.env.VIEW_KEY
    }
  }
};

const royalty_query = {
  royalty_info : {
    viewer: {
      address: process.env.ACCT_ADDRESS,
      viewing_key: process.env.VIEW_KEY
    }
  }
};

const mt_doom_query = {
  tokens: {
      owner: "secret177e9pz4heqx3jtrxav3cqrq7jvp7uthhayk8uq",
      viewer: "secret177e9pz4heqx3jtrxav3cqrq7jvp7uthhayk8uq",
      viewing_key: "DoTheRightThing.",
      limit: 200
    }
  };

const main = async () => {
  const client = new CosmWasmClient(process.env.REST_URL);

  let result1 = await client.queryContractSmart(nftAddress, info_query);
  console.log(result1)
  
  let result2 = await client.queryContractSmart(nftAddress, minted_query);
  console.log("Number minted: ", result2.num_tokens.count)

  let result3 = await client.queryContractSmart(nftAddress, royalty_query);
  console.log(result3.royalty_info.royalty_info)

  let result4 = await client.queryContractSmart(nftAddress, all_tokens_query);
  console.log("All minted tokens: ", result4.token_list.tokens)

  let result5 = await client.queryContractSmart(nftAddress, my_tokens_query);
  console.log("Your minted tokens: ", result5.token_list.tokens)
}

main().then(resp => {
  console.log("Done.");
}).catch(err => {
  console.log(err);
  console.log()
  if (err.message.includes("Wrong viewing key for this address or viewing key not set")) {
      console.error("ERROR: Viewing key not set. Please run 'yarn setkey' first.");
  } else {
      console.error(err);
  }
})
# NFT Toolkit
Example scripts to help test and deploy SNIP721 random minting contracts: https://github.com/luminaryphi/secret-random-minting-snip721-impl

## Basic Use

Rename `.env.example` to `.env` and edit with your account mnemonic, matching address, LCD REST URL, and desired contract labels.

Install dependencies: Run `yarn`

Either deploy a new SNIP20 token with `yarn deploytoken` or set TOKEN_ADDR and TOKEN_CODE_HASH to the address and code hash of an existing token.
Your address will be funded with 10M tokens when deploying a new token.

Deploy a new NFT contract: `yarn deploynft`

Pre-load it with data: `yarn preload`
By default, this repository will pre-load 1000 Crypto Punks.

Mint an NFT: `yarn mint`

Set viewing key for yourself: `yarn setkey`

Query the contract: `yarn query`

Lock contract to prevent minting: `yarn lock`
Pre-loading is still allowed while locked.

Unlock contract to allow minting again: `yarn unlock`
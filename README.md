# Scripts to automate DataX jobs

## AutoUpdateTokens.js

> Automatically fetch a new token list every midnight (time local to host server) and update a list of tokens in repo (for each supported chain).

1. install dependencies with `yarn install`
2. run `yarn tsc` to compile your typescript
3. run `yarn start` to run the script


## Supported Chains 
1: mainnet
4: rinkeby
56: bsc
137: polygon
246: energyweb
1285: moonriver

## Manual Verification

You can checkout [ManualVerification.md](ManualVerification.md) for instructions on how to use Postman to manually verify your token lists are being created correctly. 

## Adding a chain
>Keep in mind the PR's for adding a chain directly to this repository will only be accepted if they are supported on [Datapolis](https://www.datapolis.city/trade), and will only work if there is an [Ocean Protocol](https://github.com/oceanprotocol/) subgraph for that chain. 

The file naming convention for token lists is standard in this repository as well as funcitons in datax.js:

`chain<chainId>` 

You can add a chain to this script by just adding the chainId to the array passed to the [main](https://github.com/dataxfi/scripts/blob/19ac9da4995da230e9bef55d1d1c8d07f4e1b780/src/AutoUpdateTokens.ts#L201) function, as well as [adding the chain name to the chains object here](https://github.com/dataxfi/scripts/blob/657406e298d8d8d25cbb35191b2d0f201be4349f/src/AutoUpdateTokens.ts#L13) The token list will then be created and kept in this repository. 

Extensive changes to the request body, etc., are best done on a fork.


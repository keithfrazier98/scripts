# Scripts to automate DataX jobs

## AutoUpdateTokens.js

> Automatically fetch a new token list every midnight (time local to host server) and update a list of tokens in repo (for each supported chain).

1. install dependencies with `yarn install`
2. run `yarn tsc` to compile your typescript
3. run `yarn start` to run the script


## Manual Verification

You can checkout [ManualVerification.md](ManualVerification.md) for instructions on how to use Postman to manually verify your token lists are being created correctly.

## Adding a chain
>Keep in mind the PR's for adding a chain directly to this repository will only be accepted if they are supported on [Datapolis](https://www.datapolis.city/trade). 

The file naming convention for token lists is standard in this repository as well as funcitons in datax.js:

`chain<chainId>` 

You can add a chain to this script by just adding the chainId to the array passed to the [main](https://github.com/dataxfi/scripts/blob/19ac9da4995da230e9bef55d1d1c8d07f4e1b780/src/AutoUpdateTokens.ts#L201) function. The token list will then be created and kept in this repository. 

## Changing the screening method for the token lists. 

> The script fetches all of the datatokens on a chain from ocean then parses them based on specific criteria. The deciding conditional that determines whether a datatoken is added to the token lists can be found [here](https://github.com/dataxfi/scripts/blob/19ac9da4995da230e9bef55d1d1c8d07f4e1b780/src/AutoUpdateTokens.ts#L92). 

The current implementation filters the token data, and adds the token to the list if the token has a `price` attribute that has a nested `type` attribute that is equal to `pool`. This is specifically tailored to the use case of [Datapolis](https://www.datapolis.city/trade), but if your team would like to use another screening method you can simply (fork and clone then) change the criterea in the conditional. Check out [ManualVerification.md](ManualVerification.md) for a step by step guide to requesting the data with Postman, and preview the data yourself to see if another method will fit your teams needs. 

## Rinkeby

You might notice that this script does not update the Rinkeby tokenlist. This is intentional, the Rinkeby token list contains what it does and is updated manually because there are over 120,000 datatokens in Rinkbey, which would be alot of data to look through. We haven't found the need for more then a few tokens for testing.
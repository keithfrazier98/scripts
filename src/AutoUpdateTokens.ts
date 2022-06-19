// import fs from "fs";
const { GraphQLClient, gql } = require("graphql-request");

const oceanAddresses = {
  1: "0x967da4048cD07aB37855c090aAF366e4ce1b9F48",
  4: "0x8967bcf84170c91b0d24d4302c2376283b0b3a07",
  56: "0xdce07662ca8ebc241316a15b611c89711414dd1a",
  137: "0x282d8efCe846A88B159800bd4130ad77443Fa1A1",
  246: "0x593122aae80a6fc3183b2ac0c4ab3336debee528",
  1285: "0x99C409E5f62E4bd2AC142f17caFb6810B8F0BAAE",
};

const chains = {
  1: "mainnet",
  4: "rinkeby",
  56: "bsc",
  137: "polygon",
  246: "energyweb",
  1285: "moonriver",
};

interface Hit {
  symbol: string;
  decimals: string;
  address: string;
  name: string;
  supply: string;
  pools: {
    id;
  }[];
  fixedRateExchanges: {
    active;
    exchangeId;
  }[];
}

interface SingleTokenInfo extends Hit {
  isFRE: boolean;
}

/**
 * get all general token data by recursively fetching until total hits is reached. The accumulator and globalList params should not be passed manually.
 * @param chainId
 * @returns
 */

async function getTokenData(chainId: number, accumulator?: number | null, globalList?: Hit[]): Promise<any> {
  let paginationValue: number = 500;
  if (!accumulator) accumulator = 0;
  if (!globalList) globalList = [];

  const endpoint = `https://v4.subgraph.${chains[chainId]}.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph`;

  const graphQLClient = new GraphQLClient(endpoint, { headers: {} });

  const query = gql`
    {
      tokens(where: { isDatatoken: true }, first: 1000) {
        symbol
        decimals
        address
        name
        supply
        pools {
          id
        }
        fixedRateExchanges {
          active
          exchangeId
        }
      }
    }
  `;

  console.log(query);

  console.log(endpoint);
  try {
    const response = await graphQLClient.request(query);
    const total: number = response.tokens.length;
    globalList.push(response.tokens);
    accumulator += paginationValue;
    if (total > accumulator) {
      await getTokenData(chainId, accumulator, globalList);
    }
    return await Promise.resolve(globalList.flat());
  } catch (error) {
    console.error(`Error: ${error.message}`, error);
  }
}

/**
 *
 * @param globalList
 * @returns parsed list of tokens (all tokens with a pool)
 */

function parseTokenData(globalList: Hit[]): SingleTokenInfo[] {
  return globalList.map((token: Hit) => {
    try {
      return {
        ...token,
        isFRE: token.pools.length > 0 ? false : true,
      } as SingleTokenInfo;
    } catch (error) {
      console.error(`ERROR: ${error.message}`);
    }
  });
}

/**
 * prepare datatokens list (OCEAN + datatokens) to be published
 * @param tokens
 * @param chainId
 * @returns
 * a json list of datatokens
 */

function prepareDataTokenList(tokens: any, chainId: number) {
  console.log(tokens);

  try {
    let tokenList = {
      name: "Datax",
      logoURI: "https://gateway.pinata.cloud/ipfs/QmadC9khFWskmycuhrH1H3bzqzhjJbSnxAt1XCbhVMkdiY",
      keywords: ["datatokens", "oceanprotocol", "datax"],
      tags: {
        datatokens: {
          name: "Datatokens",
          description: "Ocean Protocol's Datatokens that represent access rights to underlying data and AI services",
        },
      },
      timestamp: "",
      tokens: [],
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
    };

    const tokensData = tokens.map((token) => {
      return {
        ...token,
        chainId,
        logoURI: "https://gateway.pinata.cloud/ipfs/QmPQ13zfryc9ERuJVj7pvjCfnqJ45Km4LE5oPcFvS1SMDg/datatoken.png",
        tags: ["datatoken"],
      };
    });

    // // fetch 1inch list
    // let oceantoken = [
    //   {
    //     chainId,
    //     address: oceanAddresses[chainId],
    //     symbol: "OCEAN",
    //     name: "Ocean Token",
    //     decimals: 18,
    //     logoURI: "https://gateway.pinata.cloud/ipfs/QmY22NH4w9ErikFyhMXj9uBHn2EnuKtDptTnb7wV6pDsaY",
    //     tags: ["oceantoken"],
    //   },
    // ];

    tokenList.tokens = tokensData;
    tokenList.timestamp = new Date().toISOString().replace(/.\d+[A-Z]$/, "+00:00");
    return tokenList;
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
  }
}

async function createDataTokenList(chainId: number) {
  try {
    console.log(`Generating new token list for ${chainId}.`);
    const tokenData = await getTokenData(chainId);
    // console.log("FETCHED TOKEN DATA FOR:", chainId, tokenData);
    const parsedData = parseTokenData(tokenData);
    // console.log("PARSED DATA FOR:", chainId, parsedData);
    const tokenList = prepareDataTokenList(parsedData, chainId);
    // // console.log("FINAL TOKEN LIST FOR:", chainId, tokenList);
    return JSON.stringify(tokenList);
  } catch (error) {
    console.error(error);
  }
}

async function main(chainIds: number[]): Promise<any> {
  chainIds.forEach(async (chainId) => {
    let datatoken = await createDataTokenList(chainId);
    let fileName = `chain${chainId}`;
    // fs.writeFileSync(`TokenList/${fileName}.json`, datatoken);
  });
}

main([1, 4, 137, 56, 246, 1285]);

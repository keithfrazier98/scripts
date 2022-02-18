const axios = require("axios").default;
const fs = require("fs");
require("dotenv").config();

const oceanAddresses = {
  1: "0x967da4048cD07aB37855c090aAF366e4ce1b9F48",
  4: "0x8967bcf84170c91b0d24d4302c2376283b0b3a07",
  56: "0xdce07662ca8ebc241316a15b611c89711414dd1a",
  137: "0x282d8efCe846A88B159800bd4130ad77443Fa1A1",
  246: "0x593122aae80a6fc3183b2ac0c4ab3336debee528",
  1285: "0x99C409E5f62E4bd2AC142f17caFb6810B8F0BAAE",
};

interface Hit {
  _id: string;
  _source: {
    price: {
      address: string;
      datatoken: number;
      exchange_id: string;
      isConsumable: string;
      ocean: number;
      pools: string[];
      type: string;
      value: number;
    };
    dataTokenInfo: {
      address: string;
      cap: number;
      decimals: number;
      name: string;
      symbol: string;
    };
  };
}

interface SingleTokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  pool: string;
}

/**
 * get all general token data by recursively fetching until total hits is reached. The accumulator and globalList params should not be passed manually.
 * @param chainId
 * @returns
 */

async function getTokenData(chainId: number, accumulator?: number | null, globalList?: Hit[]): Promise<any> {
  let paginationValue: number = 100;
  if (!accumulator) accumulator = 0;
  if (!globalList) globalList = [];
  try {
    const response = await axios.post("https://aquarius.oceanprotocol.com/api/v1/aquarius/assets/query", {
      from: accumulator,
      size: paginationValue,
      query: {
        bool: {
          filter: [
            { terms: { chainId: [chainId] } },
            { term: { _index: "aquarius" } },
            { term: { isInPurgatory: "false" } },
          ],
        },
      },
    });

    const total: number = response.data.hits.total;
    globalList.push(...response.data.hits.hits);
    accumulator += paginationValue;
    if (total > accumulator) {
      await getTokenData(chainId, accumulator, globalList);
    }
    return await Promise.resolve(globalList);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

/**
 *
 * @param globalList
 * @returns parsed list of tokens (all tokens with a pool)
 */

function parseTokenData(globalList: Hit[]): SingleTokenInfo[] {
 const parsedList = globalList.map((token: Hit) => {
    try {
      const { dataTokenInfo, price } = token._source;
      if (price && (price.type === "pool" || price.type === "exchange")) {
        const { name, symbol, decimals } = dataTokenInfo;
        const tokenInfo: SingleTokenInfo = {
          address: dataTokenInfo.address,
          name: name,
          symbol: symbol,
          decimals: decimals,
          pool: price.address,
        };
        return tokenInfo;
      }
    } catch (error) {
      console.error(`ERROR: ${error.message}`);
    }
  });
  return parsedList.filter(value => value !== undefined);
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
      const { address, symbol, name, pool, decimals } = token;
      return {
        chainId,
        address,
        symbol,
        pool,
        name,
        decimals,
        logoURI: "https://gateway.pinata.cloud/ipfs/QmPQ13zfryc9ERuJVj7pvjCfnqJ45Km4LE5oPcFvS1SMDg/datatoken.png",
        tags: ["datatoken"],
      };
    });

    // fetch 1inch list
    let oceantoken = [
      {
        chainId,
        address: oceanAddresses[chainId],
        symbol: "OCEAN",
        name: "Ocean Token",
        decimals: 18,
        logoURI: "https://gateway.pinata.cloud/ipfs/QmY22NH4w9ErikFyhMXj9uBHn2EnuKtDptTnb7wV6pDsaY",
        tags: ["oceantoken"],
      },
    ];

    tokenList.tokens = [...tokensData, ...oceantoken];

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
    // console.log("FINAL TOKEN LIST FOR:", chainId, tokenList);
    return JSON.stringify(tokenList);
  } catch (error) {
    console.error(error);
  }
}

async function main(chainIds: number[]): Promise<any> {
  chainIds.forEach(async (chainId) => {
    let datatoken = await createDataTokenList(chainId);
    let fileName = `chain${chainId}`;
    fs.writeFileSync(`TokenList/${fileName}.json`, datatoken);
  });
}

main([1, 137, 56, 246, 1285]);

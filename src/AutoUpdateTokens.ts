const axios = require("axios").default;
const { google } = require("googleapis");
const { GoogleAuth } = require("google-auth-library");
const schedule = require("node-schedule");
const http = require("http");
import rinkebyTokens from "./rinkebyTokens.json";
require("dotenv").config();
const oceanAddresses = {
  1: "0x967da4048cD07aB37855c090aAF366e4ce1b9F48",
  4: "0x8967bcf84170c91b0d24d4302c2376283b0b3a07",
  56: "0xdce07662ca8ebc241316a15b611c89711414dd1a",
  137: "0x282d8efCe846A88B159800bd4130ad77443Fa1A1",
  246: "0x593122aae80a6fc3183b2ac0c4ab3336debee528",
  1285: "0x99C409E5f62E4bd2AC142f17caFb6810B8F0BAAE",
};
import { CourierClient } from "@trycourier/courier";

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
    await emailOnChainError(chainId, error, "getTokenData");
  }
}

/**
 *
 * @param globalList
 * @returns parsed list of tokens (all tokens with a pool)
 */

async function parseTokenData(globalList: Hit[]): Promise<any> {
  const parsedList = globalList.map(async (token: Hit) => {
    try {
      const { dataTokenInfo, price } = token._source;
      if (price && price.type === "pool") {
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
      await emailOnError(error, "parseTokenData");
    }
  });

  const resolvedList: any = await Promise.allSettled(parsedList);
  const filteredList = resolvedList.filter((promise) => promise.value).map((promise) => promise.value);
  return filteredList;
}

/**
 * prepare datatokens list (OCEAN + datatokens) to be published
 * @param tokens
 * @param chainId
 * @returns
 * a json list of datatokens
 */

async function prepareDataTokenList(tokens: any, chainId: number) {
  try {
    let listTemplate = {
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

    listTemplate.tokens = [...tokensData, ...oceantoken];

    listTemplate.timestamp = new Date().toISOString().replace(/.\d+[A-Z]$/, "+00:00");

    return listTemplate;
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    await emailOnChainError(chainId, e, "prepareDataTokenList");
  }
}

async function createDataTokenList(chainId: number) {
  try {
    console.log("Generating new token list.");
    const tokenData = await getTokenData(chainId);
    // console.log("FETCHED TOKEN DATA FOR:", chainId, tokenData);
    const parsedData = await parseTokenData(tokenData);
    // console.log("PARSED DATA FOR:", chainId, parsedData);
    const tokenList = await prepareDataTokenList(parsedData, chainId);
    // console.log("FINAL TOKEN LIST FOR:", chainId, tokenList);
    return JSON.stringify(tokenList);
  } catch (error) {
    console.error(error);
    await emailOnChainError(chainId, error, "createDataTokenList");
  }
}

/**
 * Creates or updates token list files in google drive.
 * @returns
 *
 */
async function writeToSADrive(chainIds: number[], backups: boolean): Promise<any> {
  try {
    //create auth from SA creds
    const clientEmail = process.env.CLIENT_EMAIL;
    const privateKey = process.env.PRIVATE_KEY;
    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    //create an authorized instance of GDrive
    const drive = google.drive({ version: "v3", auth: auth });

    let fileNameConvention: string;
    backups ? (fileNameConvention = "Bdatatokens") : (fileNameConvention = "datatokens");

    //get current file list
    const fileList = await drive.files.list({
      pageSize: 100,
      fields: "nextPageToken, files(id, name)",
    });

    console.log("Current file list", fileList.data.files);

    //iterate over each file in the list and update/create a file
    chainIds.forEach(async (chainId) => {
      try {
        await emailOnUpdate(chainId);

        const found = fileList.data.files.find(
          (file: { name: string; id: string }) => file.name === `${fileNameConvention}${chainId}`
        );

        let datatokens;
        chainId === 4
          ? (datatokens = JSON.stringify(rinkebyTokens))
          : (datatokens = await createDataTokenList(chainId));

        const permissionsEmails = ["keithers98@gmail.com", "datax.fi@gmail.com"];

        if (found) {
          //update file if it already exists

          console.log(`File for chain ${chainId} was found:`, found);
          const updateResponse = await drive.files.update({
            fileId: found.id,
            requestBody: {
              name: `${fileNameConvention}${chainId}`,
              mimeType: "application/json",
            },
            media: {
              mimeType: "application/json",
              body: datatokens,
            },
          });

          console.log(
            `-------------------------------------\n -- \nSuccessfully updated file ${found.name}\nresponse status: ${updateResponse.status}\nfileId: ${found.id}\n -- \n-------------------------------------`
          );
        } else {
          // create a file if no file exists
          console.log("Creating a new file");
          const creationResponse = await drive.files.create({
            requestBody: {
              name: `${fileNameConvention}${chainId}`,
              mimeType: "application/json",
            },
            media: {
              mimeType: "application/json",
              body: datatokens,
            },
          });
          console.log(
            `-------------------------------------\n -- \nSuccessfully created file ${fileNameConvention}${chainId}\nresponse status: ${creationResponse.status}\nfileId:${creationResponse.data.id}\n -- \n-------------------------------------`
          );

          permissionsEmails.forEach(async (email) => {
            const permissionsResponse = await drive.permissions.create({
              emailMessage: `You have been added to view a file from the DataX Google Drive Service Account. \n File name: ${fileNameConvention}${chainId} \n File Id: ${creationResponse.data.id}`,
              fileId: creationResponse.data.id,
              supportsAllDrives: true,
              sendNotificationEmail: true,
              useDomainAdminAccessl: true,
              requestBody: {
                emailAddress: email,
                role: "reader",
                type: "user",
              },
            });
            console.log(
              `-------------------------------------\n -- \nSuccessfully created file permission \nresponse status: ${permissionsResponse.status}\nfileId:${permissionsResponse.data.id}\nFor email ${email}\n -- \n-------------------------------------`
            );
          });
        }
      } catch (error) {
        await emailOnChainError(chainId, error, "writeToSADrive");
      }
    });
  } catch (error) {
    console.error(error);
    await emailOnError(error, "writeToSADrive");
  }
}

const courier = CourierClient({ authorizationToken: process.env.COURIER_PK });

async function emailOnUpdate(chainId) {
  await courier.send({
    message: {
      to: {
        email: "datax.scripts@gmail.com",
      },
      template: "EQTJ9R5FFE4C93PF1YKQD9VGR74E",
      brand_id: "FRXMRF967Y4QK4H72W1M32ZRFNHS",
      data: {
        chainId: chainId,
        scriptMessage: `The DataX token list script fired @ ${new Date()}, updating chain: ${chainId}`,
      },
    },
  });
}

async function emailOnChainError(chainId, error, thrownBy) {
  await courier.send({
    message: {
      to: {
        email: "datax.scripts@gmail.com",
      },
      template: "EQTJ9R5FFE4C93PF1YKQD9VGR74E",
      brand_id: "FRXMRF967Y4QK4H72W1M32ZRFNHS",
      data: {
        chainId: chainId,
        scriptMessage: `The DataX token list caught an error @ ${new Date()} in the ${thrownBy} function, on chain ${chainId}: ${error}`,
      },
    },
  });
}

async function emailOnError(error, thrownBy) {
  await courier.send({
    message: {
      to: {
        email: "datax.scripts@gmail.com",
      },
      template: "EQTJ9R5FFE4C93PF1YKQD9VGR74E",
      brand_id: "FRXMRF967Y4QK4H72W1M32ZRFNHS",
      data: {
        scriptMessage: `The DataX token list caught an error @ ${new Date()} in the ${thrownBy} function when trying to update the token lists: ${error}`,
      },
    },
  });
}

var requestListener = function (req, res) {
  // const networks = JSON.parse(process.env.NETWORKS);
  if (req.url != "/favicon.ico" && req.url != "/backups") {
    writeToSADrive([1, 137, 56, 4, 246, 1285], false);
  }

  if (req.url === "/backups") {
    console.log("Generating backup files!");
    writeToSADrive([1, 137, 56, 4, 246, 1285], true);
  }
  console.log(req.url);
  res.writeHead(200);
  res.end("DataX");
};

var server = http.createServer(requestListener);
server.listen(process.env.PORT || 8080, () => {
  // const networks = JSON.parse(process.env.NETWORKS);
  var job = schedule.scheduleJob("0 0 0 * * *", function (fireDate) {
    writeToSADrive([1, 137, 56, 4, 246, 1285], false);
    console.log("This job was supposed to run at " + fireDate + ", and actually ran at " + new Date());
  });
});

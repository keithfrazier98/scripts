require("dotenv").config();
const axios = require("axios").default;
const { google } = require("googleapis");
const { GoogleAuth } = require("google-auth-library");
const schedule = require("node-schedule");
const http = require("http");
import rinkebyTokens from "./rinkebyTokens.json";
import { CourierClient } from "@trycourier/courier";
import { Hit, SingleTokenInfo, ListType, TokenList } from "./Types";
const oceanAddresses = {
  1: "0x967da4048cD07aB37855c090aAF366e4ce1b9F48",
  4: "0x8967bcf84170c91b0d24d4302c2376283b0b3a07",
  56: "0xdce07662ca8ebc241316a15b611c89711414dd1a",
  137: "0x282d8efCe846A88B159800bd4130ad77443Fa1A1",
  246: "0x593122aae80a6fc3183b2ac0c4ab3336debee528",
  1285: "0x99C409E5f62E4bd2AC142f17caFb6810B8F0BAAE",
};

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
    sendNotifications({ error, thrownBy: "getTokenData", chainId });
  }
}

/**
 *
 * @param globalList
 * @returns parsed list of tokens (all tokens with a pool)
 */

function parseTokenData(globalList: Hit[]): {
  stakeTokens: SingleTokenInfo[];
  tradeTokens: SingleTokenInfo[];
} {
  function extractInfo(dataTokenInfo, price): SingleTokenInfo {
    const { name, symbol, decimals } = dataTokenInfo;
    return {
      address: dataTokenInfo.address,
      name: name,
      symbol: symbol,
      decimals: decimals,
      pool: price.address,
    } as SingleTokenInfo;
  }

  const stakeTokens: SingleTokenInfo[] = [];
  const tradeTokens: SingleTokenInfo[] = [];

  globalList.forEach((token: Hit) => {
    const { dataTokenInfo, price } = token._source;
    try {
      if (price) {
        const singleTokenInfo: SingleTokenInfo = extractInfo(dataTokenInfo, price);
        // switch case used for easy additions to screening in the future
        switch (price.type) {
          case "pool":
            stakeTokens.push(singleTokenInfo);
            tradeTokens.push(singleTokenInfo);
            break;
          case "exchange":
            tradeTokens.push(singleTokenInfo);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error(`ERROR: ${error.message}`);
      sendNotifications({ error, thrownBy: "parseTokenData" });
    }
  });

  return { stakeTokens, tradeTokens };
}

/**
 * prepare datatokens list (OCEAN + datatokens) to be published
 * @param tokens
 * @param chainId
 * @returns
 * a json list of datatokens
 */

function prepareDataTokenList(tokens: any, chainId: number): TokenList {
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
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    sendNotifications({ error, thrownBy: "prepareDataTokenList", chainId });
  }
}

async function createDataTokenList(chainId: number): Promise<{ stakeList: TokenList; tradeList: TokenList }> {
  let stakeTokens, tradeTokens;
  try {
    console.log("Generating new token list.");
    const tokenData = await getTokenData(chainId);
    // console.log("FETCHED TOKEN DATA FOR:", chainId, tokenData);
    ({ stakeTokens, tradeTokens } = parseTokenData(tokenData));
    // console.log("PARSED DATA FOR:", chainId, parsedData);
    const stakeList = prepareDataTokenList(stakeTokens, chainId);
    const tradeList = prepareDataTokenList(tradeTokens, chainId);
    // console.log("FINAL TOKEN LIST FOR TRADE ON CHAIN:", chainId, tradeList);
    // console.log("FINAL TOKEN LIST FOR STAKE ON CHAIN:", chainId, stakeList);
    return { stakeList, tradeList };
  } catch (error) {
    console.error(error);
    sendNotifications({ error, thrownBy: "createDataTokenList", chainId });
  }
}

/**
 * Creates or updates token list files in google drive.
 * @returns
 *
 */
async function writeToSADrive(chainIds: number[], backups: boolean): Promise<any> {

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

  async function updateFile(listName: ListType, list: string, chainId: number, found: { name: string; id: string }) {
    console.log(`File for chain ${chainId} was found:`, found);
    const updateResponse = await drive.files.update({
      fileId: found.id,
      requestBody: {
        name: listName,
        mimeType: "application/json",
      },
      media: {
        mimeType: "application/json",
        body: list,
      },
    });
    console.log(
      `-------------------------------------\n -- \nSuccessfully updated file ${found.name}\nresponse status: ${updateResponse.status}\nfileId: ${found.id}\n -- \n-------------------------------------`
    );
  }

  async function createFile(listName: ListType, list: string, chainId: number) {
    console.log("Creating a new file");
    const creationResponse = await drive.files.create({
      requestBody: {
        name: listName,
        mimeType: "application/json",
      },
      media: {
        mimeType: "application/json",
        body: list,
      },
    });
    console.log(
      `-------------------------------------\n -- \nSuccessfully created file ${listName}\nresponse status: ${creationResponse.status}\nfileId:${creationResponse.data.id}\n -- \n-------------------------------------`
    );
    return creationResponse;
  }

  async function addPermission(creationResponse: any, name) {
    const permissionsEmails = JSON.parse(process.env.AUTH_EMAILS);
    permissionsEmails.forEach(async (email) => {
      const permissionsResponse = await drive.permissions.create({
        emailMessage: `You have been added to view a file from the DataX Google Drive Service Account. \n File name:${name} \n File Id: ${creationResponse.data.id}`,
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
        `-------------------------------------\n -- \nSuccessfully created file permission \nresponse status: ${permissionsResponse.status}\nfile: ${name}\nfileId:${permissionsResponse.data.id}\nFor email ${email}\n -- \n-------------------------------------`
      );
    });
  }

  async function updateOrCreate(found, name, list, chainId) {
    if (found) {
      //update file if it already exists
      await updateFile(name, JSON.stringify(list), chainId, found);
    } else {
      // create a file if no file exists
      const creationResponse = await createFile(name, JSON.stringify(list), chainId);
      await addPermission(creationResponse, name);
    }
  }
  try {
    // let listName: ListType;
    // backups ? (listName = "Bdatatokens") : (listName = "datatokens");

    //get current file list
    const fileList = await drive.files.list({
      pageSize: 100,
      fields: "nextPageToken, files(id, name)",
    });

    console.log("Current file list", fileList.data.files);

    //iterate over each file in the list and update or create a file
    chainIds.forEach(async (chainId) => {
      let stakeName, tradeName;
      if (backups) {
        stakeName = `bStakeTokens${chainId}`;
        tradeName = `bTradeTokens${chainId}`;
      } else {
        stakeName = `stakeTokens${chainId}`;
        tradeName = `tradeTokens${chainId}`;
      }
      try {
        sendNotifications({ chainId });

        const foundStake: any = fileList.data.files.find(
          (file: { name: string; id: string }) => file.name === stakeName
        );
        const foundTrade: any = fileList.data.files.find(
          (file: { name: string; id: string }) => file.name === tradeName
        );

        let stakeList: TokenList;
        let tradeList: TokenList;

        if (chainId === 4) {
          stakeList = rinkebyTokens;
          tradeList = rinkebyTokens;
        } else {
          ({ stakeList, tradeList } = await createDataTokenList(chainId));
        }
        await updateOrCreate(foundStake, stakeName, stakeList, chainId);
        await updateOrCreate(foundTrade, tradeName, tradeList, chainId);
      } catch (error) {
        sendNotifications({ error, thrownBy: "writeToSADrive", chainId });
      }
    });
  } catch (error) {
    console.error(error);
    sendNotifications({ error, thrownBy: "writeToSADrive" });
  }
}

async function sendNotifications({ error, chainId, thrownBy }: { error?; chainId?; thrownBy? }) {
  if (error) console.error(error);
  const courier = CourierClient({ authorizationToken: process.env.COURIER_PK });
  let emails;
  error ? (emails = JSON.parse(process.env.ERROR_EMAILS)) : (emails = JSON.parse(process.env.ALERT_EMAILS));
  console.log(emails);
  emails.forEach(async (email) => {
    let scriptMessage;
    error
      ? chainId
        ? (scriptMessage = `The DataX token list script caught an error @ ${new Date()} in the ${thrownBy} function, on chain ${chainId}: ${error}`)
        : (scriptMessage = `The DataX token list script caught an error @ ${new Date()} in the ${thrownBy} function when trying to update the token lists: ${error}`)
      : (scriptMessage = `The DataX token list script fired @ ${new Date()}, updating chain: ${chainId}`);

    console.log(email, scriptMessage);
    try {
      await courier.send({
        message: {
          to: {
            email,
          },
          template: "EQTJ9R5FFE4C93PF1YKQD9VGR74E",
          brand_id: "FRXMRF967Y4QK4H72W1M32ZRFNHS",
          data: {
            chainId,
            scriptMessage,
          },
        },
      });
    } catch (error) {
      console.error(error)
    }
  });
}

var requestListener = function (req, res) {
  const chains = JSON.parse(process.env.NETWORKS);
  // const networks = JSON.parse(process.env.NETWORKS);
  if (req.url != "/favicon.ico" && req.url != "/backups") {
    writeToSADrive(chains, false);
  }

  if (req.url === "/backups") {
    console.log("Generating backup files!");
    writeToSADrive(chains, true);
  }
  console.log(req.url);
  res.writeHead(200);
  res.end("DataX");
};

var server = http.createServer(requestListener);
server.listen(process.env.PORT || 8080, () => {
  // const networks = JSON.parse(process.env.NETWORKS);
  var job = schedule.scheduleJob("0 0 0 * * *", function (fireDate) {
    const chains = JSON.parse(process.env.NETWORKS);
    writeToSADrive(chains, false);
    console.log("This job was supposed to run at " + fireDate + ", and actually ran at " + new Date());
  });
});

const { google } = require("googleapis");
const { GoogleAuth } = require("google-auth-library");
require("dotenv").config();
const axios = require("axios").default;
var nJwt = require("njwt");

/**
 * Fetch a prepared datatoken list from google drive
 *  This function will be used instead of prepareDateTokenList, the schema is the same for each of their responses
 *
 *
 * This uses the googleapis package and the google auth library package with fucks shit up with dep tree in dataxjs, use standard requests with axios instead
 * @returns
 * Datatoken list to be published
 * (OCEAN + datatokens)
 *
 *
 */

async function fetchPreparedTokenListGoogleApis(chainId) {
  const clientEmail = process.env.CLIENT_EMAIL;
  const privateKey = process.env.PRIVATE_KEY;
  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth: auth });
    //find file using list
    const response = await drive.files.list({
      pageSize: 10,
      fields: "nextPageToken, files(id, name)",
    });

    const files = response.data.files;
    const found = files.find((file) => {
      const fileChainId = file.name.replace(/^\D+/g, "");
      return fileChainId == chainId;
    });

    const file = await drive.files.get({
      fileId: found.id,
      alt: "media",
    });

    console.log(file);
    return file.data;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Fetch a prepared datatoken list from google drive
 *  This function will be used instead of prepareDateTokenList, the schema is the same for each of their responses.
 *  This funciton uses axios which means it will function in dataxjs via the dapp without dep issues
 *
 * @returns
 * Datatoken list to be published
 * (OCEAN + datatokens)
 *
 *
 */

//this function while being used in the dapp needs to be supplied with env varibales to keep the bearer keys safe
async function fetchPreparedTokenList(chainId) {
  try {
    const { CLIENT_EMAIL, PRIVATE_KEY, TOKEN_URI, SCOPE, PRIVATE_KEY_ID } =
      process.env;
    const iat = Math.trunc(Date.now() / 1000);
    const exp = Math.trunc(iat + 3600);

    const claims = {
      iss: CLIENT_EMAIL,
      scope: SCOPE,
      aud: TOKEN_URI,
      exp: exp,
      iat: iat,
    };

    const jwt = nJwt.create(claims, PRIVATE_KEY, "RS256");
    jwt.setHeader("kid", PRIVATE_KEY_ID);

    const EnJWT = jwt.compact();

    const {
      data: { access_token },
    } = await axios.post(
      `https://oauth2.googleapis.com/token?grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${EnJWT}`
    );

    const response = await axios.get(
      "https://www.googleapis.com/drive/v3/files?pageSize=10&fields=nextPageToken%2C%20files%28id%2C%20name%29",
      {
        headers: {
          "Accept-Encoding": "gzip",
          "User-Agent": "google-api-nodejs-client/0.7.2 (gzip)",
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      }
    );

    const files = response.data.files;
    const found = files.find((file) => {
      const fileChainId = file.name.replace(/^\D+/g, "");
      return fileChainId == chainId;
    });

    const file = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${found.id}?alt=media`,
      {
        headers: {
          "Accept-Encoding": "gzip",
          "User-Agent": "google-api-nodejs-client/0.7.2 (gzip)",
          Authorization: `Bearer ${access_token}`,
          "x-goog-api-client": "gl-node/16.0.0 auth/7.10.2",
          Accept: "application/json",
        },
      }
    );

    return file.data;
  } catch (e) {
    console.error(e);
    throw Error(`ERROR : ${e.message}`);
  }
}

fetchPreparedTokenList(56).then(console.log);
//fetchPreparedTokenListGoogleApis(1);

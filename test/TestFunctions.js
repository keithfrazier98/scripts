require("dotenv").config();
const axios = require("axios").default;
var nJwt = require("njwt");
const { google } = require("googleapis");
const { GoogleAuth } = require("google-auth-library");

/**
 * Create bearer token for test session
 *
 * Creates a bearer token by creating a JWT and making a post request to google
 * @param chainId
 * @returns
 * a bearer token that can be used for the length of the test suite execution
 */

async function createBearerToken() {
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

    return access_token;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Retrieves all files from drive
 *
 * @param {*} access_token
 * @returns
 */

async function getAllFiles(access_token) {
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

  return files;
}

/**
 * Filters file list for all files with a chain number
 *
 * @param {array} fileList
 * @param {number} chainId
 * @returns
 */

function filterList(fileList, chainId) {
  const found = fileList.filter((file) => {
    const fileChainId = file.name.replace(/^\D+/g, "");
    return Number(fileChainId) == chainId;
  });

  return found;
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
 *(data attribute from the axios request)
 */

//this function while being used in the dapp needs to be supplied with env varibales to keep the bearer keys safe
async function fetchPreparedTokenList(fileId, access_token) {
  try {
    const file = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
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

function findFile(chainId, files) {
  const found = files.find((file) => {
    const fileChainId = file.name.replace(/^\D+/g, "");
    return Number(fileChainId) == chainId;
  });

  return found;
}

async function deleteFilesInDrive(num) {
  const clientEmail = process.env.CLIENT_EMAIL;
  const privateKey = process.env.PRIVATE_KEY;
  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive = google.drive({ version: "v3", auth: auth });

  await drive.files.list(
    {
      pageSize: num,
      fields: "nextPageToken, files(id, name)",
    },
    (err, res) => {
      if (err) return console.error("The API returned an error: " + err);
      const files = res.data.files;
      console.log(
        `There were ${files.length} files in the service account drive.`
      );
      if (files.length) {
        files.map(async (file) => {
          console.log(`Deleting ${file.name}: ${file.id}`);
          try {
            const res = await drive.files.delete({ fileId: file.id });
            console.log("Status " + res.status + ": deletion successful");
          } catch (error) {
            console.log(error);
          }
        });
      } else {
        console.log("No files found.");
      }
    }
  );
}

/**
 * Creates or updates token list files in google drive.
 * @returns
 *
 */
async function testWriteToSADrive() {
  try {
    //create auth from SA creds
    const clientEmail = process.env.CLIENT_EMAIL;
    const privateKey = process.env.PRIVATE_KEY;
    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/drive.file","https://www.googleapis.com/auth/drive"],
    });

    //create an authorized instance of GDrive
    const drive = google.drive({ version: "v3", auth: auth });

    const testJson = JSON.stringify({ testing: "Hello World" });
    const updateJson = JSON.stringify({testing: "This is an update!"})
    //get current file list
    const fileList = await drive.files.list({
      pageSize: 100,
      fields: "nextPageToken, files(id, name)",
    });

    console.log("Current file list", fileList.data.files);

    //iterate over each file in the list and update/create a file
    const found = fileList.data.files.find(
      (file) => file.name === "testFile"
    );

    if (found) {
      //update file if it already exists
      console.log(`testFile was found:`, found);
      const updateResponse = await drive.files.update({
        fileId: found.id,
        requestBody: {
          name: "testFile",
          mimeType: "application/json",
        },
        media: {
          mimeType: "application/json",
          body: updateJson,
        },
      });

      console.log(
        updateResponse,
        `-------------------------------------\n -- \nSuccessfully updated file ${found.name}\nresponse status: ${updateResponse.status}\nfileId: ${found.id}\n -- \n-------------------------------------`
      );
    } else {
      // create a file if no file exists
      console.log("Creating a new file");
      const creationResponse = await drive.files.create({
        requestBody: {
          name: 'testFile',
          mimeType: "application/json",
          writersCanShare: true,
          supportsAllDrives:true
        },
        media: {
          mimeType: "application/json",
          body: testJson,
        },
      });
      console.log(
        `-------------------------------------\n -- \nSuccessfully created file testJson \nresponse status: ${creationResponse.status}\nfileId:${creationResponse.data.id}\n -- \n-------------------------------------`
      );

      const permissionsResponse = await drive.permissions.create({
        emailMessage:`You have been added to view a file from the DataX Google Drive Service Account. \n File name: testFile \n File Id: ${creationResponse.data.id}`,
        fileId: creationResponse.data.id, 
        supportsAllDrives: true,
        sendNotificationEmail: true,
        useDomainAdminAccessl: true, 
        requestBody: {
            "emailAddress": "keithers98@gmail.com",
            "role": "reader",
            "type": "user",
        },
      })
      console.log(
        `-------------------------------------\n -- \nSuccessfully created file permission \nresponse status: ${permissionsResponse.status}\nfileId:${permissionsResponse.data.id}\n -- \n-------------------------------------`
      );
    }
  } catch (error) {
    console.error(error);
  }
}

// function checkEnvVars (){
//   console.log(JSON.parse(process.env.NETWORKS))
// }

// function checkConfig(){
  
// }

//checkEnvVars()
//testWriteToSADrive();

// delete X files at a time
deleteFilesInDrive(100)

//create Bearer Token then get all files
//// createBearerToken().then((res) => {
////   getAllFiles(res).then(console.log);
//// });

//create brearer token then fetch a particular file
//// createBearerToken().then((res) => {
////   fetchPreparedTokenList("1_iIxM4JuxO0v66h4Lyse7ChwcPdZuqk_", res).then(
////     console.log
////   );
//// });

module.exports = {
  createBearerToken,
  fetchPreparedTokenList,
  getAllFiles,
  filterList,
  findFile,
};

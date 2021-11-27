# Scripts to automate DataX jobs

## AutoUpdateTokens.js
> Automatically fetch a new token list every midnight (time local to host server) and update a list of tokens in google drive (for each supported chain).


  To run locally: 

  1. clone into local repo
  2. you will need to set two env variables with credentials from a GCS service_account: 
    - `CLIENT_EMAIL = "your_SA_.iam.gserviceaccount.com"`
    - `PRIVATE_KEY = "-----BEGIN PRIVATE KEY----- your_private_key -----END PRIVATE KEY-----"`
  3. install dependencies with `yarn install`
  4. run `yarn start` to spin up local server
  5. run `yarn run monitor` to view logs
  6. run `yarn run stop` to stop the application

The script can be manually executed by visiting the url it is hosted on, resulting in it being ran one time. You could then check Gdrive with the script below. By default, the script will run at midnight wherever the server it is hosted on is located.

### Env variables 

**In a local .env file** the variables can be set as follows:
- CLIENT_EMAIL="your_SA_.iam.gserviceaccount.com"
- PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----"
> Note above that there is a new line (\n) escape character in the private key, and both keys are wrapped in quotations.

**In a hosted platform with a env interface** the variables can be set as follows: 

- CLIENT_EMAIL : your_SA_.iam.gserviceaccount.com
- PRIVATE_KEY : 
  
  -----BEGIN PRIVATE KEY-----
       your_private_key
  -----END PRIVATE KEY-----

> Note that there are no quotations around either of the variables and the private key is seperated by actual new lines. 



## TestFetchTokenList.js
> Use this script to verify there has been something written to GDrive

  There are two functions in the script that do the same thing (getting a file of tokens corresponding to a chain ID). One of them uses google-auth-library and googleapis packages, the other uses json web tokens with axios. Client side react apps can use google-auth-library, but **AutoUpdateTokens** does. 

  Both function calls are commented out at the bottom. Uncomment one and use **node src/TestFetchTokenList.js** to log the response from GDrive. 

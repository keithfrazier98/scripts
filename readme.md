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



# Scripts to automate DataX jobs

## AutoUpdateTokens.js
> Automatically fetch a new token list every midnight (time local to host server) and update a list of tokens in google drive (for each supported chain).
>  
> This repository is hosted on a Digital Ocean Ubuntu server and can be accessed with a verified SSH key through your terminal. 


  To run locally: 

    1. clone into local repo
    2. you will need to set two env variables with credentials from a GCS service_account: 
    
      - `CLIENT_EMAIL = "your_SA_.iam.gserviceaccount.com"`
      - `PRIVATE_KEY = "-----BEGIN PRIVATE KEY----- your_private_key -----END PRIVATE KEY-----"`
    3. install dependencies with `yarn install`
    4. run `yarn start` to spin up local server
    5. run `yarn run monitor` to view logs
    6. run `yarn run stop` to stop the application

  Connecting with SSH: 
>  You can connect connect to the DO droplet using OpenSSH with a verified SSH key. 


    1. Aquire an SSH key. 
    2. Ensure the key is added to the authorized_keys file. 
    3. Use  ```ssh root@64.227.118.254 -i <path-to-key-file>```  to connect.(Mac/Lunix user will most likely need to use  ```sudo```)

The script can be manually instantiate by visiting the url/port it is hosted on, resulting in it being ran one time. You could then check Gdrive with TestFetchTokenList or if the files are shared to your drive then you can check there. By default, the script will run at midnight wherever the server it is hosted on is located.

  **Manually running the script :**

  When connected to the droplet using SSH you can use the ```curl``` command to instantiate the script manually, or if you are running a local server you can jusst visit the following local urls in your browser. 

  - Use ```curl http://localhost:8080/``` to create or update the main files.
  - Use ```curl http://localhost:8080/backups``` to create or generate backup files.


<hr />

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

<hr />

## TestFetchTokenList.js
> Use this script to verify there has been something written to GDrive

  There are two functions in the script that do the same thing (getting a file of tokens corresponding to a chain ID). One of them uses google-auth-library and googleapis packages, the other uses json web tokens with axios. Client side react apps can use google-auth-library, but **AutoUpdateTokens** does. 

  Both function calls are commented out at the bottom. Uncomment one and use **node src/TestFetchTokenList.js** to log the response from GDrive. 

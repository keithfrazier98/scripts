# 🧑‍🚀 Manually verifying token lists with Postman 🚀

> Regularly checking the token lists against responses from Postman helps ensure the scripts are running correctly and token lists are as accurate as possible.

The following are instructions on how to use Postman to complete a GQL request.

## Setup

1. Open Postman, either in the browser or through the native app.
2. Open a new request tab

## Query all tokens for a chain

1. Set the request type to a POST request
2. Enter this URL `https://v4.subgraph.(chain-name-here).oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph`
3. Select the GQL and wait for the schema to be fetched
5. Enter the following information in the body

```
query {
      tokens(where: { isDatatoken: true }, first: 1000) {
        address
        name
        supply
        pools {
          id
        }
      }
    }
```

> If you don't see the token you are looking for, there might be more than 1000 tokens, and the query above only gets 1000 tokens.

## Looking up particular tokens

1. steps 1-5 above
```{
    token(id:"0xda72767849189eab2e5d76677738d4b83b2efcb7"){
        address
        name
        supply
    }
}```
  
Check out the [GraphiQL](https://v4.subgraph.mainnet.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph/) to explore the schema.
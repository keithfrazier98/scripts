# 🧑‍🚀 Manually verifying token lists with Postman 🚀

> Regularly checking the token lists against responses from Postman helps ensure the scripts are running correctly and token lists are as accurate as possible.

The following are instrunctions on how to use Postman to request and filter the token lists in the same way the AutoUpdateTokens.ts does.

## Setup

1. Open Postman, either in the browser or through the native app.
2. Open a new request tab

## Query all tokens for a chain

1. Set the request type to a POST request
2. Enter this URL `https://aquarius.oceanprotocol.com/api/v1/aquarius/assets/query`
3. Navigate to the body tab and select `raw`
4. Select `JSON` for the raw body data type
5. Enter the following information in the body

```
{
    "from": 0,
    "size": <responseSize>,
    "query": {
        "bool": {
            "filter": [
                {
                    "terms": {
                        "chainId": [
                            <chainId>
                        ]
                    }
                },
                {
                    "term": {
                        "_index": "aquarius"
                    }
                },
                {
                    "term": {
                        "isInPurgatory": "false"
                    }
                }
            ]
        }
    }
}
```

`responseSize`: Enter a `Number` here of the response size you'd like.
(Recommended to start with 100)

`chainId`: Enter a `Number` here of the chain id you qant to query for.

isInPurgatory: Filters out tokens in pergatory, because the ones that are, are negligable.

Response sample for 100 shards on chain 56:
````
{
    "_shards": {
        "failed": 0,
        "skipped": 0,
        "successful": 10,
        "total": 10
    },
    "hits": {
        "hits": [
            <tokenObjects>
        ],
        "max_score": 0.0,
        "total": 14
    },
    "timed_out": false,
    "took": 3
}
````
> You can start with 100 responses, for some chains this will be enough. You can then check the bottom of the responses' `hits` object for the `total` attribute. The above example is 14, meaning there are only 14 responses available, even though 100 were requested. If this number is greater than the requested amount, you can set the request amount to the total for the easiest filtering later.  

## Search for datatokens with price type of pool 

AutoUpdateTokens.js uses the response from the query above and filters out all of the tokens that don't have a `price` attribute or the `price` > `type` attribute isn't set to `pool`. 

You can mimick this in postman by simply searching in the response. 

1. press cmd+f (mac/linux), cmd+f (windows), or click the magnifing glass icon in the response nav bar. 

2. Type this in the search bar:  `"type": "pool"`
3. Take note of the total matches
4. Type this in the search bar:  `"type": "exchange"`
5. Take note of the total matches

At this point you can just check the response count in the search bar against the amount of tokens you are expecting to see. The token list for trading should match the number of matches for both searches, and the token list for staking should only match the number of matches for the "pool" search. 

## Looking up particular tokens

1. Set the query type to GET
2. Use this url:  `https://aquarius.oceanprotocol.com/api/v1/aquarius/assets/ddo/did:op:<hash>`
   -    The hash is the specific did:op: hash you're looking for. 
  
> This information is the exact same information in the query for all of the tokens. 
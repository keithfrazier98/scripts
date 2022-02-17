export interface Hit {
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
  
  export interface SingleTokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    pool?: string;
    tags: string[];
    logoURI: string
    chainId: number
  }
  
  export interface TokenList {
    name:string,
    logoURI: string,
    keywords: string[],
    tags: {
        datatokens: {
            name: string,
            description: string
        }
    },
    timestamp: string,
    tokens: SingleTokenInfo[]
    }
    
  
  export type ListType = "stakeTokens" | "tradeTokens" | "bStakeTokens" | "bTradeTokens";
  

  

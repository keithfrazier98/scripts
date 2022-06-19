declare const GraphQLClient: any, gql: any;
declare const fs: any;
declare const oceanAddresses: {
    1: string;
    4: string;
    56: string;
    137: string;
    246: string;
    1285: string;
};
declare const chains: {
    1: string;
    4: string;
    56: string;
    137: string;
    246: string;
    1285: string;
};
interface Hit {
    symbol: string;
    decimals: string;
    address: string;
    name: string;
    supply: string;
    pools: {
        id: any;
    }[];
    fixedRateExchanges: {
        active: any;
        exchangeId: any;
    }[];
}
interface SingleTokenInfo extends Hit {
    isFRE: boolean;
}
declare function getTokenData(chainId: number, accumulator?: number | null, globalList?: Hit[]): Promise<any>;
declare function parseTokenData(globalList: Hit[]): SingleTokenInfo[];
declare function prepareDataTokenList(tokens: any, chainId: number): {
    name: string;
    logoURI: string;
    keywords: string[];
    tags: {
        datatokens: {
            name: string;
            description: string;
        };
    };
    timestamp: string;
    tokens: any[];
    version: {
        major: number;
        minor: number;
        patch: number;
    };
};
declare function createDataTokenList(chainId: number): Promise<string>;
declare function main(chainIds: number[]): Promise<any>;

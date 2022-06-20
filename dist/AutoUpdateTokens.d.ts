declare const axios: any;
declare const fs: any;
declare const oceanAddresses: {
    1: string;
    4: string;
    56: string;
    137: string;
    246: string;
    1285: string;
};
interface Hit {
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
interface SingleTokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    pool?: string;
    exchangeId?: string;
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

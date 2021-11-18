declare const axios: any;
declare const google: any;
declare const GoogleAuth: any;
declare const schedule: any;
interface Hit {
    _id: string;
}
interface SingleTokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: string;
    pool: string;
}
declare function getTokenData(chainId: number, accumulator?: number | null, globalList?: Hit[]): Promise<any>;
declare function parseTokenData(globalList: Hit[]): Promise<any>;
declare function prepareDataTokenList(tokens: any, chainId: number): Promise<{
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
}>;
declare function createDataTokenList(chainId: number): Promise<string>;
declare function writeToSADrive(chainIds: number[]): Promise<any>;
declare const job: any;

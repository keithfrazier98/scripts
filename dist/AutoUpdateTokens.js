var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var axios = require("axios").default;
var google = require("googleapis").google;
var GoogleAuth = require("google-auth-library").GoogleAuth;
var schedule = require("node-schedule");
require("dotenv").config();
function getTokenData(chainId, accumulator, globalList) {
    return __awaiter(this, void 0, void 0, function () {
        var paginationValue, response, total, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    paginationValue = 100;
                    if (!accumulator)
                        accumulator = 0;
                    if (!globalList)
                        globalList = [];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4, axios.post("https://aquarius.oceanprotocol.com/api/v1/aquarius/assets/query", {
                            from: accumulator,
                            size: paginationValue,
                            query: {
                                bool: {
                                    filter: [
                                        { terms: { chainId: [chainId] } },
                                        { term: { _index: "aquarius" } },
                                        { term: { isInPurgatory: "false" } },
                                    ],
                                },
                            },
                        })];
                case 2:
                    response = _a.sent();
                    total = response.data.hits.total;
                    globalList.push.apply(globalList, response.data.hits.hits);
                    accumulator += paginationValue;
                    if (!(total > accumulator && accumulator < 500)) return [3, 4];
                    return [4, getTokenData(chainId, accumulator, globalList)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [4, Promise.resolve(globalList)];
                case 5: return [2, _a.sent()];
                case 6:
                    error_1 = _a.sent();
                    console.error("Error: ".concat(error_1.message));
                    return [3, 7];
                case 7: return [2];
            }
        });
    });
}
function parseTokenData(globalList) {
    return __awaiter(this, void 0, void 0, function () {
        var parsedList, resolvedList, filteredList;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    parsedList = globalList.map(function (token) { return __awaiter(_this, void 0, void 0, function () {
                        var tokenDid, response, _a, dataTokenInfo, price, name_1, symbol, decimals, tokenInfo, error_2;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    tokenDid = token._id;
                                    return [4, axios.get("https://aquarius.oceanprotocol.com/api/v1/aquarius/assets/ddo/".concat(tokenDid))];
                                case 1:
                                    response = _b.sent();
                                    _a = response.data, dataTokenInfo = _a.dataTokenInfo, price = _a.price;
                                    if (price && price.type === "pool") {
                                        name_1 = dataTokenInfo.name, symbol = dataTokenInfo.symbol, decimals = dataTokenInfo.decimals;
                                        tokenInfo = {
                                            address: dataTokenInfo.address,
                                            name: name_1,
                                            symbol: symbol,
                                            decimals: decimals,
                                            pool: price.address,
                                        };
                                        return [2, tokenInfo];
                                    }
                                    return [3, 3];
                                case 2:
                                    error_2 = _b.sent();
                                    console.error("ERROR: ".concat(error_2.message));
                                    throw Error("ERROR: ".concat(error_2.message));
                                case 3: return [2];
                            }
                        });
                    }); });
                    return [4, Promise.allSettled(parsedList)];
                case 1:
                    resolvedList = _a.sent();
                    filteredList = resolvedList
                        .filter(function (promise) { return promise.value; })
                        .map(function (promise) { return promise.value; });
                    return [2, filteredList];
            }
        });
    });
}
function prepareDataTokenList(tokens, chainId) {
    return __awaiter(this, void 0, void 0, function () {
        var listTemplate, tokensData, oceantoken;
        return __generator(this, function (_a) {
            try {
                listTemplate = {
                    name: "Datax",
                    logoURI: "https://gateway.pinata.cloud/ipfs/QmadC9khFWskmycuhrH1H3bzqzhjJbSnxAt1XCbhVMkdiY",
                    keywords: ["datatokens", "oceanprotocol", "datax"],
                    tags: {
                        datatokens: {
                            name: "Datatokens",
                            description: "Ocean Protocol's Datatokens that represent access rights to underlying data and AI services",
                        },
                    },
                    timestamp: "",
                    tokens: [],
                    version: {
                        major: 1,
                        minor: 0,
                        patch: 0,
                    },
                };
                tokensData = tokens.map(function (token) {
                    var address = token.address, symbol = token.symbol, name = token.name, pool = token.pool, decimals = token.decimals;
                    return {
                        chainId: chainId,
                        address: address,
                        symbol: symbol,
                        pool: pool,
                        name: name,
                        decimals: decimals,
                        logoURI: "https://gateway.pinata.cloud/ipfs/QmPQ13zfryc9ERuJVj7pvjCfnqJ45Km4LE5oPcFvS1SMDg/datatoken.png",
                        tags: ["datatoken"],
                    };
                });
                oceantoken = [
                    {
                        chainId: chainId,
                        address: "0x8967bcf84170c91b0d24d4302c2376283b0b3a07",
                        symbol: "OCEAN",
                        name: "Ocean Token",
                        decimals: 18,
                        logoURI: "https://gateway.pinata.cloud/ipfs/QmY22NH4w9ErikFyhMXj9uBHn2EnuKtDptTnb7wV6pDsaY",
                        tags: ["oceantoken"],
                    },
                ];
                listTemplate.tokens = __spreadArray(__spreadArray([], tokensData, true), oceantoken, true);
                listTemplate.timestamp = new Date()
                    .toISOString()
                    .replace(/.\d+[A-Z]$/, "+00:00");
                return [2, listTemplate];
            }
            catch (e) {
                console.error("ERROR: ".concat(e.message));
                throw Error("ERROR : ".concat(e.message));
            }
            return [2];
        });
    });
}
function createDataTokenList(chainId) {
    return __awaiter(this, void 0, void 0, function () {
        var tokenData, parsedData, tokenList;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Generating new token list.");
                    return [4, getTokenData(chainId)];
                case 1:
                    tokenData = _a.sent();
                    return [4, parseTokenData(tokenData)];
                case 2:
                    parsedData = _a.sent();
                    return [4, prepareDataTokenList(parsedData, chainId)];
                case 3:
                    tokenList = _a.sent();
                    return [2, JSON.stringify(tokenList)];
            }
        });
    });
}
function writeToSADrive(chainIds) {
    return __awaiter(this, void 0, void 0, function () {
        var clientEmail, privateKey, auth, drive;
        var _this = this;
        return __generator(this, function (_a) {
            clientEmail = process.env.CLIENT_EMAIL;
            privateKey = process.env.PRIVATE_KEY;
            auth = new GoogleAuth({
                credentials: {
                    client_email: clientEmail,
                    private_key: privateKey,
                },
                scopes: ["https://www.googleapis.com/auth/drive.file"],
            });
            drive = google.drive({ version: "v3", auth: auth });
            chainIds.forEach(function (chainId, index) { return __awaiter(_this, void 0, void 0, function () {
                var datatokens;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, drive.files.list({
                                pageSize: 10,
                                fields: "nextPageToken, files(id, name)",
                            }, function (err, res) {
                                if (err)
                                    return console.error("The API returned an error: " + err);
                                var files = res.data.files;
                                if (files.length && index === 0) {
                                    files.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                                        var res;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    console.log("Deleting ".concat(file.name, ": ").concat(file.id));
                                                    return [4, drive.files.delete({ fileId: file.id })];
                                                case 1:
                                                    res = _a.sent();
                                                    console.log("Status " + res.status + ": deletion successful");
                                                    return [2];
                                            }
                                        });
                                    }); });
                                }
                                else {
                                    console.log("No files found.");
                                }
                            })];
                        case 1:
                            _a.sent();
                            return [4, createDataTokenList(chainId)];
                        case 2:
                            datatokens = _a.sent();
                            console.log("Creating a new file");
                            return [4, drive.files.create({
                                    requestBody: {
                                        name: "datatokens".concat(chainId),
                                        mimeType: "application/json",
                                    },
                                    media: {
                                        mimeType: "application/json",
                                        body: datatokens,
                                    },
                                }, function (err, res) {
                                    if (err)
                                        console.error(err);
                                    console.log(res.data);
                                })];
                        case 3:
                            _a.sent();
                            return [2];
                    }
                });
            }); });
            return [2];
        });
    });
}
var job = schedule.scheduleJob("0 * * * * *", function () {
    writeToSADrive([1, 137, 56, 4]);
});
exports.createDataTokenList = createDataTokenList;
//# sourceMappingURL=AutoUpdateTokens.js.map
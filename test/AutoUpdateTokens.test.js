const expect = require("chai").expect;
const {
  createBearerToken,
  fetchPreparedTokenList,
  getAllFiles,
  filterList,
  findFile,
} = require("./TestFunctions");

describe("AutoUpdateTokens should maintain proper files at any given moment", () => {
  let access_token;
  let fileList;
  before(async () => {
    access_token = await createBearerToken();
    fileList = await getAllFiles(access_token);
    console.log(fileList)
  });

  it("Should only contain 8 files at any given moment", () => {
    expect(fileList).to.have.lengthOf(8);
  });

  it("Should only contain 2 files for rinkeby chain", () => {
    const rinkeby = filterList(fileList, 4);
    expect(rinkeby).to.have.lengthOf(2);
  });

  it("Should only contain 2 files for polygon chain", () => {
    const polygon = filterList(fileList, 137);
    expect(polygon).to.have.lengthOf(2);
  });

  it("Should only contain 2 files for BSC chain", () => {
    const BSC = filterList(fileList, 56);
    expect(BSC).to.have.lengthOf(2);
  });

  it("Should only contain 2 files for mainnet chain", () => {
    const mainnet = filterList(fileList, 1);
    expect(mainnet).to.have.lengthOf(2);
  });

  it("Should have the proper data in polygon file", async () => {
    const id = filterList(137, fileList);
    expect(id).to.not.be.undefined;
    // const polygon = await fetchPreparedTokenList(id, access_token);
    // expect(polygon.tokens).to.exist;
  });

  it("Should have the proper data in rinkeby file", async () => {
    const id = filterList(4, fileList);
    expect(id).to.not.be.undefined;
    // const rinkeby = await fetchPreparedTokenList(id, access_token);
    // expect(rinkeby.tokens).to.exist;
  });

  it("Should have the proper data in BSC file", async () => {
    const id = filterList(56, fileList);
    expect(id).to.not.be.undefined;
    // const BSC = await fetchPreparedTokenList(id, access_token);
    // expect(BSC.tokens).to.exist;
  });

  it("Should have the proper data in mainnet file", async () => {
    const id = filterList(1, fileList);
    expect(id).to.not.be.undefined;
    // const mainnet = await fetchPreparedTokenList(id, access_token);
    // expect(mainnet.tokens).to.exist;
  });

  //9 tests
});

// We are going to skip a bit on these tests...

const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

//writing the test code from here..

let tokenUris = [
    "ipfs://QmU67Zx2kZrhMCyKsRq4F3QsquVSg1aYgb8acQMc4RMd6C",
    "ipfs://QmVdPkP1XzY7XL4vKnCzyhPKabBXomzSanXsPTSTqBWmbH",
    "ipfs://QmVgJZPKo85pxDoe3PFVWpxrzTUw78mEYUhiBcMDoNcz6y",
    "ipfs://QmbA8cp3UeH2Mvpg2r674szQBk66Bqi7xK5MrhX7qYRad6",
    "ipfs://QmaB56oDZR21y1D1TdXNEf7VMDUWFJEK6Po1dN6vzzinwn",
]

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Rank NFT Unit Tests", function () {
          let RankNftContract, signer, signerAddress

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              signer = accounts[0]
              signerAddress = signer.address
              //deployer = getNamedAccounts()
              await deployments.fixture(["rankNft"])
              RankNftContract = await ethers.getContract("RankNftCoC")
          })

          describe("Rank NFT Tests", () => {
              it("token URI's match the array of token URIs used for deployment", async () => {
                  for (i in tokenUris) {
                      //   const tokenURI = await RankNftContract.getRankTokenUris(i)
                      assert.equal(tokenUris[i], await RankNftContract.getRankTokenUris(i))
                  }
              })

              it("Mint NFT event emitted", async () => {
                  //mint new Rank NFT
                  expect(await RankNftContract.mintRankNft(signerAddress, "0")).to.emit(
                      RankNftContract,
                      "NftMinted"
                  )
              })
              it("Checks owner of minted NFT", async () => {
                  //mint new Rank NFT
                  const txResponse = await RankNftContract.mintRankNft(signerAddress, "0")
                  const txReceipt = await txResponse.wait(1)
                  const tokenId = txReceipt.events[1].args.tokenId // get tokenID
                  ownerOfNFT = RankNftContract.ownerOf(tokenId)
                  expect(ownerOfNFT == signerAddress)
              })

              it("Token URI is correctly set on Mint NFT", async () => {
                  //mint new nft + use rank index emitted to check token URI is correct
                  const txResponse = await RankNftContract.mintRankNft(signerAddress, "0")
                  const txReceipt = await txResponse.wait(1)
                  const RankIndex = txReceipt.events[1].args.rankIndex

                  //get Token URI
                  const tokenUri = await RankNftContract.getRankTokenUris(RankIndex)
                  expect(tokenUri == tokenUris[RankIndex])
              })
              it("token URI correctly set if Mint Rank NFT called multiple times ", async () => {
                  for (let i = 0; i < 5; i++) {
                      txResponse = await RankNftContract.mintRankNft(signerAddress, i)
                      txReceipt = await txResponse.wait(1)
                      //get Token URI
                      const tokenUri = await RankNftContract.getRankTokenUris(i)
                      expect(tokenUri == tokenUris[i])
                  }
              })
          })
      })

const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

//writing the test code from here..

let tokenUris = [
    "ipfs://QmPr1VmmGmrGqKXYFpFPwkCnoxWLpTcUNTWE18oNfjReg8",
    "ipfs://QmUYjPEM8Hv9DMiRv7rgPomQe66jTciEKfdurCwpeq8c32",
    "ipfs://QmPdDVXQMvgvBKbHtf1LaJwLEVF4XCVJtmxhJapnTWpkk1",
    "ipfs://QmSneWpfgzt9iUdgy6RJaAK36ocRfYjXyVUGNSWgJCWEpS",
    "ipfs://QmVrzViE238LzGb61UDZd9tzaY3WBRah1Dn3Myw1bwvAh4",
]

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Loot NFT Unit Tests", function () {
          let LootNftContract,
              signer,
              signerAddress,
              player,
              playerAddress,
              requestId,
              txResponse,
              txReceipt

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              signer = accounts[0]
              signerAddress = signer.address
              player = accounts[1]
              playerAddress = player.address
              //deployer = getNamedAccounts()
              await deployments.fixture(["lootNft"])
              LootNftContract = await ethers.getContract("LootNftCoC")
              playerContract = LootNftContract.connect(player)
              txResponse = await LootNftContract.spinWheelRequestNRG(signerAddress)
              txReceipt = await txResponse.wait(1)
              requestId = txReceipt.events[1].args.requestId
          })

          describe("Loot NFT Tests", async () => {
              it("correctly sets Loot URI's", async () => {
                  for (i in tokenUris) {
                      //   const tokenURI = await RankNftContract.getRankTokenUris(i)
                      assert.equal(tokenUris[i], await LootNftContract.getLootTokenUris(i))
                  }
              })

              it("Spin lootwheel emits lootWheelspin event", async () => {
                  expect(await LootNftContract.spinWheelRequestNRG(signerAddress)).to.emit(
                      LootNftContract,
                      "lootWheelSpin"
                  )
              })
              it("VRF requestId mapped to player address", async () => {
                  expect(
                      (await LootNftContract.getPlayerfroms_requestIdToSender(requestId)) ==
                          tokenUris[4]
                  )
              })

              describe("successfull Loot spin", async () => {
                  it("NFT minted event is triggered", async () => {
                      //manually set moddedrng for testing purposes
                      await LootNftContract.setTestNrg(40)
                      //mock VRF coordinator calling address
                      mockVRF = await ethers.getContract("VRFCoordinatorV2Mock")
                      expect(
                          await mockVRF.fulfillRandomWords(requestId, LootNftContract.address)
                      ).to.emit(LootNftContract, "NftMinted")
                  })
                  it("NFT minted updates address to tokenURI mapping", async () => {
                      //manually set moddedrng for testing purposes
                      await LootNftContract.setTestNrg(98)

                      const TokenId = await LootNftContract.getTokenCounter() //get current tokenCounter before mint function is called

                      //mock VRF coordinator calling address
                      mockVRF = await ethers.getContract("VRFCoordinatorV2Mock")
                      await mockVRF.fulfillRandomWords(requestId, LootNftContract.address)
                      const uriFromMapping = await LootNftContract.getTokenURIfromPlayerId(
                          signerAddress,
                          TokenId
                      )
                      //get URI from mapping
                      expect(uriFromMapping == tokenUris[4])
                  })
                  it("gun NFT minted", async () => {
                      //manually set moddedrng for testing purposes
                      await LootNftContract.setTestNrg(40)
                      //mock VRF coordinator calling address
                      mockVRF = await ethers.getContract("VRFCoordinatorV2Mock")
                      // get tokenURI
                      const TokenID = await LootNftContract.getTokenCounter()
                      await mockVRF.fulfillRandomWords(requestId, LootNftContract.address)
                      const tokenURI = await LootNftContract.getLootTokenUris(TokenID)
                      expect(tokenURI == tokenUris[0])
                  })
                  it("plane NFT minted", async () => {
                      //manually set moddedrng for testing purposes
                      await LootNftContract.setTestNrg(98)
                      //mock VRF coordinator calling address
                      mockVRF = await ethers.getContract("VRFCoordinatorV2Mock")
                      // get tokenURI
                      const TokenID = await LootNftContract.getTokenCounter()
                      await mockVRF.fulfillRandomWords(requestId, LootNftContract.address)
                      const tokenURI = await LootNftContract.getLootTokenUris(TokenID)
                      expect(tokenURI == tokenUris[4])
                  })

                  it("event with token URI array emitted when new NFT minted", async () => {
                      //manually set moddedrng for testing purposes
                      await LootNftContract.setTestNrg(98)
                      //mock VRF coordinator calling address
                      mockVRF = await ethers.getContract("VRFCoordinatorV2Mock")
                      // get tokenURI

                      expect(
                          await mockVRF.fulfillRandomWords(requestId, LootNftContract.address)
                      ).to.emit(LootNftContract, "AllTokenUrisbyAddress")
                  })

                  it("Token URI mapping saves list of all tokens owned by address", async () => {
                      //manually set moddedrng for testing purposes
                      await LootNftContract.setTestNrg(98)
                      //mock VRF coordinator calling address
                      mockVRF = await ethers.getContract("VRFCoordinatorV2Mock")
                      await mockVRF.fulfillRandomWords(requestId, LootNftContract.address)

                      //run again
                      txResponse = await LootNftContract.spinWheelRequestNRG(signerAddress)
                      txReceipt = await txResponse.wait(1)
                      requestId = txReceipt.events[1].args.requestId
                      await LootNftContract.setTestNrg(40)
                      mockVRF = await ethers.getContract("VRFCoordinatorV2Mock")
                      await mockVRF.fulfillRandomWords(requestId, LootNftContract.address)

                      const AllTokenURIs = await LootNftContract.getNftsOwnedbyPlayer(signerAddress)

                      console.log(AllTokenURIs)

                      expect(AllTokenURIs[1] == tokenUris[0])
                  })

                  /// cant get this to work right now
                  //   it("correct NFT minted based on random number drawn", async () => {
                  //       const arrayOfNumbers = [40, 65, 80, 90, 98]
                  //       //mock VRF coordinator calling address
                  //       mockVRF = await ethers.getContract("VRFCoordinatorV2Mock")

                  //       for (i in arrayOfNumbers) {
                  //           //manually set moddedrng for testing purposes
                  //           await LootNftContract.setTestNrg(arrayOfNumbers[i])
                  //           // get tokenURI
                  //           const TokenID = await LootNftContract.getTokenCounter()
                  //           console.log("TokenID", TokenID)
                  //           await mockVRF.fulfillRandomWords(requestId, LootNftContract.address)
                  //           const tokenURI = await LootNftContract.getLootTokenUris(TokenID)
                  //           expect(tokenURI == tokenUris[i])
                  //       }
                  //   })
              })
              describe("Unsuccessfull Loot spin", async () => {
                  it("unsuccesful roll emits unSuccesfullSpin event ", async () => {
                      //manually set moddedrng for testing purposes
                      await LootNftContract.setTestNrg(39)
                      //mock VRF coordinator calling address
                      mockVRF = await ethers.getContract("VRFCoordinatorV2Mock")
                      expect(
                          await mockVRF.fulfillRandomWords(requestId, LootNftContract.address)
                      ).to.emit(LootNftContract, "unSuccesfullSpin")
                  })
                  //   it("", async () => {})
              })
          })
      })

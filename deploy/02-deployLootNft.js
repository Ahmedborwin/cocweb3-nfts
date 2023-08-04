const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")
const { metadataTemplateArray } = require("../constants")

let tokenUris = [
    "ipfs://QmPr1VmmGmrGqKXYFpFPwkCnoxWLpTcUNTWE18oNfjReg8",
    "ipfs://QmUYjPEM8Hv9DMiRv7rgPomQe66jTciEKfdurCwpeq8c32",
    "ipfs://QmPdDVXQMvgvBKbHtf1LaJwLEVF4XCVJtmxhJapnTWpkk1",
    "ipfs://QmSneWpfgzt9iUdgy6RJaAK36ocRfYjXyVUGNSWgJCWEpS",
    "ipfs://QmVrzViE238LzGb61UDZd9tzaY3WBRah1Dn3Myw1bwvAh4",
]

const FUND_AMOUNT = "1000000000000000000000"
const imagesLocation = "images/Loot"

///Need to amend the metadata some for different weapons

module.exports = async ({ deployments, namedAccounts }) => {
    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock, CoCLootNft, CoCLootNftAddress

    const { deploy, log } = deployments

    const accounts = await ethers.getSigners()
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }

    if (chainId == 31337) {
        // create VRFV2 Subscription

        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address

        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)

        subscriptionId = transactionReceipt.events[0].args.subId
        // Fund the subscription
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }

    arguments = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId]["gasLane"],
        networkConfig[chainId]["callbackGasLimit"],
        tokenUris,
    ]

    console.log("Start Deploying LOOT NFT Contract")
    console.log("-------------------------------------------------")

    CoCLootNft = await deploy("LootNftCoC", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    CoCLootNftAddress = await CoCLootNft.address

    console.log("-------------------DEPLOYED----------------------")
    console.log("-------------------------------------------------")

    if (developmentChains.includes(network.name)) {
        console.log("address of Loot contract", CoCLootNftAddress)
        //add consumer of VRF
        vrfCoordinatorV2Mock.addConsumer(subscriptionId, CoCLootNftAddress)
    }

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(CoCLootNftAddress, arguments)
    }
}

async function handleTokenUris() {
    // Check out https://github.com/PatrickAlphaC/nft-mix for a pythonic version of uploading
    // to the raw IPFS-daemon from https://docs.ipfs.io/how-to/command-line-quick-start/
    // You could also look at pinata https://www.pinata.cloud/
    tokenUris = []
    counter = 1
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
    for (imageUploadResponseIndex in imageUploadResponses) {
        let tokenUriMetadata = metadataTemplateArray[imageUploadResponseIndex]
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        console.log(`Uploading ${tokenUriMetadata.name}...`)
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("Token URIs uploaded! They are:")
    console.log(tokenUris)
    return tokenUris
}

module.exports.tags = ["all", "main", "lootNft"]

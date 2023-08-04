const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")

const imagesLocation = "images"

let tokenUris = [
    "ipfs://QmU67Zx2kZrhMCyKsRq4F3QsquVSg1aYgb8acQMc4RMd6C",
    "ipfs://QmVdPkP1XzY7XL4vKnCzyhPKabBXomzSanXsPTSTqBWmbH",
    "ipfs://QmVgJZPKo85pxDoe3PFVWpxrzTUw78mEYUhiBcMDoNcz6y",
    "ipfs://QmbA8cp3UeH2Mvpg2r674szQBk66Bqi7xK5MrhX7qYRad6",
    "ipfs://QmaB56oDZR21y1D1TdXNEf7VMDUWFJEK6Po1dN6vzzinwn",
]

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Rank",
            value: 1,
        },
    ],
}

module.exports = async ({ deployments, namedAccounts }) => {
    const { deploy, log } = deployments

    const accounts = await ethers.getSigners()
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId

    if (process.env.UPLOAD_TO_PINATA == "true" && !tokenUris) {
        tokenUris = await handleTokenUris()
    }

    arguments = [tokenUris]

    console.log("Start Deploying Rank NFT Contract")
    console.log("-------------------------------------------------")

    const CoCRankNft = await deploy("RankNftCoC", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    console.log("-------------------DEPLOYED----------------------")
    console.log("-------------------------------------------------")

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        const CoCRankNftAddress = await CoCRankNft.address
        await verify(CoCRankNftAddress, arguments)
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
        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
        tokenUriMetadata.description = `${tokenUriMetadata.name} badge!`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        tokenUriMetadata.attributes[0].value = counter
        console.log(`Uploading ${tokenUriMetadata.name}...`)
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)

        counter++
    }
    console.log("Token URIs uploaded! They are:")
    console.log(tokenUris)
    return tokenUris
}

module.exports.tags = ["all", "main", "rankNft"]

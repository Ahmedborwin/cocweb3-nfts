const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")

const imagesLocation = "images"

let tokenUris = [
    "ipfs://QmRhAM7ioVhw7c195R4KcjSoKrGWQiSvsBha64NhEPpkr1",
    "ipfs://QmWiBZNhSCnkf9M7nYVRnFjoG3DxZnkhzJ1tqeuGN9drYk",
    "ipfs://QmTjQKWjkC6yTT4KqbJyqiWKAqkewMY3hZNrJMQQmFEw7V",
    "ipfs://QmbZnZYR8JofQrPU6AnHgJSb4hgDT9Wa72BMEApw7MN1kr",
    "ipfs://QmVqNqTEN5xZLTj2XxuYPkwFQdHNokwsEZG74Bp9GjvVQd",
    "ipfs://QmZTeedRh5XDSEHxANZKgQAgYYZqm1Wx3f1FyVNyRtLz3S",
    "ipfs://QmY6stzBnW2r9KyHyHejk6xtoP3KY1WyL6Je5jMcfVwcSo",
    "ipfs://QmTfbVwkNZXzRdThiDeSTUEcyVfzAnHivhtB9b1jCqScM9",
    "ipfs://QmYH4KiJVW2AiVu4wJCQoqZciezFtqjvvoUDK2Vk5mjB5e",
    "ipfs://QmWfoWciJEHx43ztnw2svEGhxWubZ4FY2rB9obRreqCA17",
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

    if (process.env.UPLOAD_TO_PINATA == "true") {
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

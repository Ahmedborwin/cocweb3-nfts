const { ethers, network } = require("hardhat")
const fs = require("fs")

// const FRONT_END_ADDRESSES_FILE = "../cocweb3-frontend/constants/contractAddresses.json"
// const FRONT_END_ABI_FILE = "../cocweb3-frontend/constants/abi.json"

const COC_GAME_Rank_ADDRESSES_FILE = "../CodeOfConflict-V2/constants/RankNft/contractAddresses.json"
const COC_GAME_Rank_ABI_FILE = "../CodeOfConflict-V2/constants/RankNft/abi.json"

const COC_GAME_Loot_ADDRESSES_FILE = "../CodeOfConflict-V2/constants/LootNft/contractAddresses.json"
const COC_GAME_Loot_ABI_FILE = "../CodeOfConflict-V2/constants/LootNft/abi.json"

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        //console.log("<<<<<<<<<<<<<<<<UPDATING FRONT END>>>>>>>>>>>>>>>>")
        await LootNftupdateContractAddresses()
        await RankNftupdateContractAddresses()
        await RankNftUpdateAbi()
        await LootNftUpdateAbi()
    }
}

async function RankNftUpdateAbi() {
    const RankNft = await ethers.getContract("RankNftCoC")
    fs.writeFileSync(
        COC_GAME_Rank_ABI_FILE,
        RankNft.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function LootNftUpdateAbi() {
    const LootNft = await ethers.getContract("LootNftCoC")
    fs.writeFileSync(
        COC_GAME_Loot_ABI_FILE,
        LootNft.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function RankNftupdateContractAddresses() {
    const RankNft = await ethers.getContract("RankNftCoC")

    //amend the contract address on our addresses json file
    const chainId = network.config.chainId.toString()

    const currentAddresses = JSON.parse(fs.readFileSync(COC_GAME_Rank_ADDRESSES_FILE, "utf8"))
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(RankNft.address)) {
            currentAddresses[chainId].push(RankNft.address)
        }
    } else {
        currentAddresses[chainId] = [RankNft.address]
    }
    fs.writeFileSync(COC_GAME_Rank_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}

async function LootNftupdateContractAddresses() {
    const LootNft = await ethers.getContract("LootNftCoC")

    //amend the contract address on our addresses json file
    const chainId = network.config.chainId.toString()
    const currentAddresses = JSON.parse(fs.readFileSync(COC_GAME_Loot_ADDRESSES_FILE, "utf8"))
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(LootNft.address)) {
            currentAddresses[chainId].push(LootNft.address)
        }
    } else {
        currentAddresses[chainId] = [LootNft.address]
    }
    fs.writeFileSync(COC_GAME_Loot_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}

module.exports.tags = ["all", "update"]

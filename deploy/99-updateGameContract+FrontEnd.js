const { ethers, network } = require("hardhat")
const fs = require("fs")

// write data to front end
const RANK_FRONTEND_ADDRESSES_FILE = "../cocweb3-frontendV2/constants/RankContractAddress.json"
const RANK_FRONTEND_ABI_FILE = "../cocweb3-frontendV2/constants/Rankabi.json"

const LOOT_FRONTEND_ADDRESSES_FILE = "../cocweb3-frontendV2/constants/LootcontractAddress.json"
const LOOT_FRONTEND_ABI_FILE = "../cocweb3-frontendV2/constants/Lootabi.json"

//write data to game contract
const RANK_GAME_ADDRESSES_FILE = "../CodeOfConflict-V2/constants/RankContractAddress.json"
const RANK_GAME_ABI_FILE = "../CodeOfConflict-V2/constants/Rankabi.json"

const LOOT_GAME_ADDRESSES_FILE = "../CodeOfConflict-V2/constants/LootContractAddress.json"
const LOOT_GAME_ABI_FILE = "../CodeOfConflict-V2/constants/Lootabi.json"

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        //console.log("<<<<<<<<<<<<<<<<UPDATING FRONT END>>>>>>>>>>>>>>>>")
        await LootNftupdateContractAddresses()
        await LootNftUpdateAbi()
        await RankNftupdateContractAddresses()
        await RankNftUpdateAbi()
    }
}

async function RankNftUpdateAbi() {
    const RankNft = await ethers.getContract("RankNftCoC")
    //update front end
    fs.writeFileSync(
        RANK_FRONTEND_ABI_FILE,
        RankNft.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function LootNftUpdateAbi() {
    const LootNft = await ethers.getContract("LootNftCoC")
    fs.writeFileSync(
        LOOT_FRONTEND_ABI_FILE,
        LootNft.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function RankNftupdateContractAddresses() {
    const RankNft = await ethers.getContract("RankNftCoC")

    //amend the contract address on our addresses json file
    const chainId = network.config.chainId.toString()

    //write to frontend
    const currentAddresses = JSON.parse(fs.readFileSync(RANK_FRONTEND_ADDRESSES_FILE, "utf8"))
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(RankNft.address)) {
            currentAddresses[chainId].pop(RankNft.address)
        }
    } else {
        currentAddresses[chainId] = [RankNft.address]
    }
    fs.writeFileSync(RANK_FRONTEND_ADDRESSES_FILE, JSON.stringify(currentAddresses))

    //write to game contract

    //write to frontend
    const currentAddressesGame = JSON.parse(fs.readFileSync(RANK_GAME_ADDRESSES_FILE, "utf8"))
    if (chainId in currentAddressesGame) {
        if (!currentAddressesGame[chainId].includes(RankNft.address)) {
            currentAddressesGame[chainId].pop(RankNft.address)
        }
    } else {
        currentAddressesGame[chainId] = [RankNft.address]
    }
    fs.writeFileSync(RANK_GAME_ADDRESSES_FILE, JSON.stringify(currentAddressesGame))
}

async function LootNftupdateContractAddresses() {
    const LootNft = await ethers.getContract("LootNftCoC")

    //amend the contract address on our addresses json file
    const chainId = network.config.chainId.toString()

    //write to front end
    const currentAddresses = JSON.parse(fs.readFileSync(LOOT_GAME_ADDRESSES_FILE, "utf8"))
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(LootNft.address)) {
            currentAddresses[chainId].pop(LootNft.address)
        }
    } else {
        currentAddresses[chainId] = [LootNft.address]
    }
    fs.writeFileSync(LOOT_GAME_ADDRESSES_FILE, JSON.stringify(currentAddresses))

    //write to game contract
    const currentAddressesGame = JSON.parse(fs.readFileSync(LOOT_GAME_ADDRESSES_FILE, "utf8"))
    if (chainId in currentAddressesGame) {
        if (!currentAddressesGame[chainId].includes(LootNft.address)) {
            currentAddressesGame[chainId].pop(LootNft.address)
        }
    } else {
        currentAddressesGame[chainId] = [LootNft.address]
    }
    fs.writeFileSync(LOOT_GAME_ADDRESSES_FILE, JSON.stringify(currentAddressesGame))
}

module.exports.tags = ["all", "update"]

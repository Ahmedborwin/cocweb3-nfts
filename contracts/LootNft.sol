// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "hardhat/console.sol";

error CoCLootNft__AlreadyInitialized();
error CoCLootNft__NeedMoreETHSent();
error CoCLootNft__RangeOutOfBounds();

contract LootNftCoC is ERC721URIStorage, VRFConsumerBaseV2, Ownable {
    //types

    enum Loot {
        Gun,
        Sheild,
        Grenade,
        Tank,
        Plane
    }

    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 5;

    // NFT Variables
    uint256 internal testRng = 0;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    uint256 private s_tokenCounter;

    string[] internal s_LootTokenUris;
    string[] internal s_LootTokenUrisownedbyPlayer;

    bool private s_initialized;

    // VRF Helpers
    mapping(uint256 => address) public s_requestIdToSender;

    //NFT to address storage mapping
    mapping(address => mapping(uint256 => string)) public s_addressToTokenURI;
    //All NFT's to address storage mapping
    mapping(address => string[]) public s_addressToAllTokenURIs;

    // Events
    event lootWheelSpin(uint256 indexed requestId, address indexed player);
    event LootNftMinted(
        uint256 indexed tokenId,
        address indexed player,
        address indexed nftAddress
    );
    event AllTokenUrisbyAddress(string[] indexed tokenUris, address indexed player);
    event unSuccesfullSpin(address indexed player);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane, // keyHash
        uint32 callbackGasLimit,
        string[5] memory _s_LootTokenUris
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Loot NFT For COC", "CoCLoot") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        _initializeContract(_s_LootTokenUris);
        s_tokenCounter = 0;
    }

    function spinWheelRequestNRG(address _player) public returns (uint256 requestId) {
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        s_requestIdToSender[requestId] = _player;
        emit lootWheelSpin(requestId, _player);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 moddedRng;

        address _player = s_requestIdToSender[requestId];

        if (testRng > 0) {
            moddedRng = testRng;
        } else {
            moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        }

        if (moddedRng < 40) {
            emit unSuccesfullSpin(_player);
        } else {
            uint256 newItemId = s_tokenCounter;
            s_tokenCounter = s_tokenCounter + 1;

            Loot lootPrize = _getLootFromModdedRng(moddedRng);

            //Mint Nft + set token URI

            _safeMint(_player, newItemId);
            _setTokenURI(newItemId, s_LootTokenUris[uint256(lootPrize)]);

            //Populate mapping of address to tokenId to URI
            s_addressToTokenURI[_player][newItemId] = s_LootTokenUris[uint256(lootPrize)];

            // push new token URI to list of tokens owned by address and saved to a mapping

            s_addressToAllTokenURIs[_player].push(s_LootTokenUris[uint256(lootPrize)]);

            emit AllTokenUrisbyAddress(s_addressToAllTokenURIs[_player], _player); // emit string of URIs as indexed event

            emit LootNftMinted(newItemId, _player, address(this));
        }
    }

    function LootWheelSpinFromGameContract(address _player, uint256 _randomNumber) external {
        uint256 moddedRng;

        if (testRng > 0) {
            moddedRng = testRng;
        } else {
            moddedRng = _randomNumber;
        }

        if (moddedRng < 40) {
            emit unSuccesfullSpin(_player);
        } else {
            uint256 newItemId = s_tokenCounter;
            s_tokenCounter = s_tokenCounter + 1;

            Loot lootPrize = _getLootFromModdedRng(moddedRng);

            _safeMint(_player, newItemId);
            _setTokenURI(newItemId, s_LootTokenUris[uint256(lootPrize)]);

            s_addressToTokenURI[_player][newItemId] = s_LootTokenUris[uint256(lootPrize)];

            //populate list of URI's owned by player
            // push new token URI list of token owned by address and saved to a mapping

            s_addressToAllTokenURIs[_player].push(s_LootTokenUris[uint256(lootPrize)]);

            emit AllTokenUrisbyAddress(s_addressToAllTokenURIs[_player], _player); // emit string of URIs as indexed event

            emit LootNftMinted(newItemId, _player, address(this));
        }
    }

    function _getLootFromModdedRng(uint256 moddedRng) internal pure returns (Loot) {
        uint256 cumulativeSum = 0;
        uint8[5] memory chanceArray = _getChanceArray();
        for (uint256 i = 0; i < chanceArray.length; i++) {
            //Empty spin = 0-19 (40%)
            // gun = 20-49 (24%)
            // shield = 50 - 74 (15%)
            // grendade = 75 - 89 (10%)
            // Tank = 90-97 (7%)
            // plane = 98-100 (3%)

            if (moddedRng >= cumulativeSum && moddedRng < chanceArray[i]) {
                return Loot(i);
            }
            cumulativeSum = chanceArray[i];
        }
        revert CoCLootNft__RangeOutOfBounds();
    }

    function _getChanceArray() internal pure returns (uint8[5] memory) {
        return [20, 50, 75, 90, 98];
    }

    function _initializeContract(string[5] memory LogTokenUris) private {
        if (s_initialized) {
            revert CoCLootNft__AlreadyInitialized();
        }
        s_LootTokenUris = LogTokenUris;
        s_initialized = true;
    }

    /**
     * Getter + Testing functions
     *
     */

    function setNewOwner(address _newOwner) external {
        transferOwnership(_newOwner); // function from ownable, only Owner modifier assigned to function on ownable contract
    }

    function setTestNrg(uint256 _nrgSet) external onlyOwner {
        testRng = _nrgSet; // set nrg
    }

    function getTokenCounter() external view returns (uint256) {
        return s_tokenCounter;
    }

    function getPlayerfroms_requestIdToSender(uint256 requestId) external view returns (address) {
        return s_requestIdToSender[requestId];
    }

    function getLootTokenUris(uint256 index) public view returns (string memory) {
        return s_LootTokenUris[index];
    }

    function getTokenURIfromPlayerId(
        address player,
        uint256 tokenId
    ) external view returns (string memory) {
        return s_addressToTokenURI[player][tokenId];
    }

    function getNftsOwnedbyPlayer(address player) external view returns (string[] memory) {
        return s_addressToAllTokenURIs[player];
    }
}

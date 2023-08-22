// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

error CoCRankNft__AlreadyInitialized();
error CoCRankNft__NeedMoreETHSent();

contract RankNftCoC is ERC721URIStorage {
    // NFT Variables
    string[] internal s_rankUris;
    bool internal s_initialized = false;
    uint256 private s_tokenCounter;

    //events
    event RankNftMinted(
        address indexed nftAdress,
        address indexed playerAddress,
        uint256 indexed tokenId,
        uint256 rankIndex
    );

    //NFT to address storage mapping
    mapping(address => mapping(uint256 => string)) public s_addressToTokenURI;

    constructor(string[10] memory _s_rankUris) ERC721("Rank Emblem", "CoC-RankNFT") {
        _initializeContract(_s_rankUris);
    }

    function _initializeContract(string[10] memory rankUris) private {
        if (s_initialized) {
            revert CoCRankNft__AlreadyInitialized();
        }
        s_rankUris = rankUris;
        s_initialized = true;
    }

    function mintRankNft(address player, uint256 rankIndex) public {
        // if (msg.sender != owner) {
        //     revert CoCRankNft__NeedMoreETHSent();
        // }

        uint256 newItemId = s_tokenCounter;

        s_tokenCounter = s_tokenCounter + 1;

        _safeMint(player, newItemId);

        _setTokenURI(newItemId, s_rankUris[uint256(rankIndex)]);

        s_addressToTokenURI[player][newItemId] = s_rankUris[uint256(rankIndex)];

        emit RankNftMinted(address(this), player, newItemId, rankIndex);
    }

    function getRankTokenUris(uint256 rankIndex) external view returns (string memory) {
        return s_rankUris[rankIndex];
    }
}

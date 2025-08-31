// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Guarda SOLO el tokenURI => ipfs://<CID ó CID/archivo> (el JSON está cifrado)
contract ScoreNFT is ERC721URIStorage, Ownable {
    uint256 public nextId;
    constructor() ERC721("ZKredit Score NFT", "ZKS") Ownable(msg.sender) {}
    function mintTo(address to, string memory ipfsCidOrPath)
        external onlyOwner returns (uint256 tokenId)
    {
        tokenId = ++nextId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", ipfsCidOrPath)));
    }
}

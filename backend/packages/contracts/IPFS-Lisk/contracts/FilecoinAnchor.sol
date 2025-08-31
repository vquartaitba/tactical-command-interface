// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FilecoinAnchor {
  struct Ref {
    string cid;        // ej: "bafy.../zkredit.enc.json"
    string pieceCid;   // opcional, si lo tenés
    uint64 dealId;     // opcional, si lo tenés
    bytes32 encHash;   // keccak256(bytes del JSON cifrado)
  }
  mapping(bytes32 => Ref) public byKey; // p.ej. key = keccak256(liskNFT, tokenId)

  event Anchored(bytes32 indexed key, string cid, string pieceCid, uint64 dealId, bytes32 encHash);

  function set(bytes32 key, Ref calldata r) external {
    byKey[key] = r;
    emit Anchored(key, r.cid, r.pieceCid, r.dealId, r.encHash);
  }
}

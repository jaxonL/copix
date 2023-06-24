// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// WorldCoin integration
import { ByteHasher } from "./helpers/ByteHasher.sol";
import { IWorldID } from "./interfaces/IWorldID.sol";

contract Copix is ERC721, Ownable {
  using ByteHasher for bytes;

  uint256 private _tokenId;

  struct Pixel {
    uint256 tokenId;
    uint256[] editTimestamp;
    string[] color;
    uint8[] editedByHuman;
  }

  // State Variables
  uint256 public immutable cooldownTime; // in seconds
  uint256 public immutable canvasWidth;
  uint256 public immutable canvasHeight;

  // world id state vars
  /** @dev The World ID instance that will be used for verifying proofs */
  IWorldID internal immutable worldId;
  /** @dev The contract's external nullifier hash */
  uint256 internal immutable externalNullifier;
  /** @dev The World ID group ID (1 to be human) */
  uint8 internal immutable groupId_human = 1;
  /** @dev The World ID group ID (0 is phone) */
  uint8 internal immutable groupId_phone = 0;

  string public greeting = "Building Unstoppable Apps!!!";
  bool public premium = false;
  uint256 public totalCounter = 0;
  /** @dev world id nullifier hashes to last edit timestamp (human-gated, instead of wallet-gated) */
  mapping(uint256 => uint256) public lastEditTime;
  /** @dev world id nullifier hashes for the paint action to # of times it was used */
  mapping(uint256 => uint256) public humanEdits;
  mapping(uint256 => address) public tokenIdToOwner; // similar to _owners
  mapping(uint256 => Pixel) public pixels;

  // Events: a way to emit log statements from smart contract that can be listened to by external parties
  event GreetingChange(address indexed greetingSetter, string newGreeting, bool premium, uint256 value);

  // TODO: create a paint event that emits the address, new color, pixel, human

  // Modifier: used to define a set of rules that must be met before or after a function is executed
  // Check the withdraw() function
  modifier isOwner() {
      // msg.sender: predefined variable that represents address of the account that called the current function
      require(msg.sender == owner(), "Not the Owner");
      _;
  }

  // Constructor: Called once on contract deployment
  // Check packages/hardhat/deploy/00_deploy_your_contract.ts
  /**
   * @param _worldId The WorldID instance that will verify the proofs
   * @param _appId The World ID app ID
   * @param _actionId The World ID action ID
   */
  constructor(uint256 _cooldownTime, uint256 _width, uint256 _height, IWorldID _worldId, string memory _appId, string memory _actionId) ERC721("Copix", "CPX") Ownable() {
    cooldownTime = _cooldownTime;
    canvasWidth = _width;
    canvasHeight = _height;
    worldId = _worldId;
    externalNullifier = abi
      .encodePacked(abi.encodePacked(_appId).hashToField(), _actionId)
      .hashToField();
  }

  function paint(
    uint256 x, uint256 y, string memory color,
    address signal, uint256 root, uint256 humanNullifierHash, uint256[8] calldata proof
  ) public {
    // sure why not let's keep this
    require(bytes(color).length == 7, "color must be a hex string of length 7");
    uint256 tokenId = _getTokenIdFromPixel(x, y);

    uint256 humanityCode = _verifyHumanity(signal, root, humanNullifierHash, proof);

    // TODO: better error message
    require(lastEditTime[humanNullifierHash] + cooldownTime < block.timestamp, "Paint: user cooldown not finished");
    lastEditTime[humanNullifierHash] = block.timestamp;
    humanEdits[humanNullifierHash] += 1;

    // TODO: create/update token metadata

    // update actual ownership of pixel
    if (tokenIdToOwner[tokenId] == address(0)) {
      tokenIdToOwner[tokenId] = msg.sender;
      _safeMint(msg.sender, tokenId);
    } else {
      // transfer to new owner
      safeTransferFrom(tokenIdToOwner[tokenId], msg.sender, tokenId);
      // TODO: milestone 2: mint new token representing current state of canvas to previous owner
    }
  }

  function _getTokenIdFromPixel(uint256 x, uint256 y) private view returns (uint256) {
    // TODO: check less than width/height
    require(x >= canvasWidth, "x must be less than canvas width limit");
    require(y >= canvasHeight, "y must be less than canvas height limit");
    
    return ((y * canvasWidth) + x);
  }

  // TODO: create private function to update metadata given token id and new color
  function updatePixel(uint256 tokenId, uint256 timeStamp, uint8 editedByHuman, string calldata newColor) private {
    Pixel storage pixel = pixels[tokenId];
    pixel.color.push(newColor);
    pixel.editTimestamp.push(block.timestamp);
    pixel.editedByHuman.push(editedByHuman);

  }


  // TODO: getTokenUri override function that returns the latest color + timestamp
  // function tokenUri(uint256 tokenId) public view override returns (string memory) {
  //   require(_exists(tokenId), "Pixel does not exist");
  //   string memory colour = colours[tokenId];
  //   string memory baseURI = "https://example.com/tokens/";
  //   string memory tokenURISuffix = ".json";
  //   string memory json = string(
  //       abi.encodePacked(
  //           '{ "color": "', latestColor,
  //           '", "timestamp": ', uint256ToString(latestTimestamp),
  //           ' }'
  //       )

  //   return string(abi.encodePacked('data:application/json;utf8,{"name":"Copix pixel #'tokenId'", "description":"TEMPUS EDAX RERUM\\n',
  //         ((block.timestamp-_creationTimestamp)/86400).toString(),'", "created_by":"Pak", "image":"',
  //           _generateImage(distance, completion, c1curve, c2curve, randHue, randOffset),
  //           '"}'));    
  //   return string(abi.encodePacked("data:application/json;utf8,{", tokenId.toString(), tokenURISuffix));

  // }

  /**
   * verifies humanity of user using worldcoin
   * @param signal An arbitrary input from the user, usually the user's wallet address (check README for further details)
   * @param root The root of the Merkle tree (returned by the JS widget).
   * @param nullifierHash The nullifier hash for this proof, preventing double signaling (returned by the JS widget).
   * @param proof The zero-knowledge proof that demonstrates the claimer is registered with World ID (returned by the JS widget).
   */
  function _verifyHumanity(
      address signal,
      uint256 root,
      uint256 nullifierHash,
      uint256[8] calldata proof
  ) private returns (uint8) {
    // We now verify the provided proof is valid and the user is verified by World ID
    verifyHumanityCheck(
      signal,
      root,
      nullifierHash,
      proof
    );

    // We now record the user has done this action x + 1 times
    humanEdits[nullifierHash] = humanEdits[nullifierHash] + 1;

    // return type of verif (right now, always human)
    return groupId_human + 1;
  }

  /**
   * @dev debug function to verify humanity of user using worldcoin without modifying state.
   * see _verifyHumanity for param info
   */
  function verifyHumanityCheck(
      address signal,
      uint256 root,
      uint256 nullifierHash,
      uint256[8] calldata proof
  ) public view {
    // We now verify the provided proof is valid and the user is verified by World ID
    worldId.verifyProof(
      root,
      groupId_human, // always verify is human
      abi.encodePacked(signal).hashToField(),
      nullifierHash,
      externalNullifier,
      proof
    );
  }

  function mint(address to) public onlyOwner {
      _tokenId += 1;
      _safeMint(to, _tokenId);
  }

  function getTokenId() public view returns (uint256) {
      return _tokenId;
  }

  // TODO: enforce safe transfer to only be allowed to be called from this contract
  function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual override {
    super.safeTransferFrom(from, to, tokenId, _data);
  }

  // /**
  //  * Function that allows anyone to change the state variable "greeting" of the contract and increase the counters
  //  *
  //  * @param _newGreeting (string memory) - new greeting to save on the contract
  //  */
  // function setGreeting(string memory _newGreeting) public payable {
  //     // Print data to the hardhat chain console. Remove when deploying to a live network.
  //     console.log("Setting new greeting '%s' from %s",  _newGreeting, msg.sender);

  //     // Change state variables
  //     greeting = _newGreeting;
  //     totalCounter += 1;
  //     userGreetingCounter[msg.sender] += 1;

  //     // msg.value: built-in global variable that represents the amount of ether sent with the transaction
  //     if (msg.value > 0) {
  //         premium = true;
  //     } else {
  //         premium = false;
  //     }

  //     // emit: keyword used to trigger an event
  //     emit GreetingChange(msg.sender, _newGreeting, msg.value > 0, 0);
  // }

  /**
   * Function that allows the owner to withdraw all the Ether in the contract
   * The function can only be called by the owner of the contract as defined by the isOwner modifier
   */
  function withdraw() isOwner public {
      (bool success,) = owner().call{value: address(this).balance}("");
      require(success, "Failed to send Ether");
  }

  /**
   * Function that allows the contract to receive ETH
   */
  receive() external payable {}
}
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
  event PixelUpdate(address indexed painter, uint256 x, uint256 y, string color, uint256 timestamp, uint8 editedByHuman);

  // Modifier: used to define a set of rules that must be met before or after a function is executed
  // Check the withdraw() function
  modifier isOwner() {
    // msg.sender: predefined variable that represents address of the account that called the current function
    require(msg.sender == owner(), "Not the Owner");
    _;
  }

  modifier onlyContract() {
    require(msg.sender == address(this), "Not the Copix contract");
    _;
  }

  // Constructor: Called once on contract deployment
  // Check packages/hardhat/deploy/00_deploy_your_contract.ts
  // TODO: enforce groupd id in constructor
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
    uint256 x, uint256 y, string calldata color,
    address signal, uint256 root, uint256 humanNullifierHash, uint256[8] calldata proof
  ) public {
    // sure why not let's keep this
    require(bytes(color).length == 7, "color must be a hex string of length 7");
    uint256 tokenId = _getTokenIdFromPixel(x, y);

    uint8 humanityCode = _verifyHumanity(signal, root, humanNullifierHash, proof);

    // TODO: better error message
    require(lastEditTime[humanNullifierHash] + cooldownTime < block.timestamp, "Paint: user cooldown not finished");
    lastEditTime[humanNullifierHash] = block.timestamp;
    humanEdits[humanNullifierHash] += 1;

    // create/update token metadata
    _updatePixel(tokenId, humanityCode, color);

    // update actual ownership of pixel
    if (tokenIdToOwner[tokenId] == address(0)) {
      _safeMint(msg.sender, tokenId);
    } else {
      // transfer to new owner
      safeTransferFrom(tokenIdToOwner[tokenId], msg.sender, tokenId);
      // TODO: milestone 2: mint new token representing current state of canvas to previous owner
    }
    tokenIdToOwner[tokenId] = msg.sender;

    // emit paint event
    emit PixelUpdate(msg.sender, x, y, color, block.timestamp, humanityCode);
  }

  function _getTokenIdFromPixel(uint256 x, uint256 y) private view returns (uint256) {
    // TODO: check less than width/height
    require(x >= canvasWidth, "x must be less than canvas width limit");
    require(y >= canvasHeight, "y must be less than canvas height limit");
    
    return ((y * canvasWidth) + x);
  }

  /**
   * updates or creates a pixel's metadata
   * @param tokenId id of token
   * @param editedByHuman 1 if edited by phone, 2 if edited by human
   * @param newColor new color hex code
   */
  function _updatePixel(uint256 tokenId, uint8 editedByHuman, string calldata newColor) private {
    /** since we're using 0-indexed, cannot rely on tokenid 0 check, so have to check ownership existence */
    if (tokenIdToOwner[tokenId] == address(0)) {
      // create new pixel
      Pixel memory pixel;
      pixel.tokenId = tokenId;
      pixels[tokenId] = pixel;
    }

    pixels[tokenId].color.push(newColor);
    pixels[tokenId].editTimestamp.push(block.timestamp);
    pixels[tokenId].editedByHuman.push(editedByHuman);
  }


  // TODO: add color, timestamp etc. as attributes in json so it shows on OpenSea
  function tokenUri(uint256 tokenId) public view returns (string memory) {
    require(tokenId < canvasHeight * canvasWidth, "Pixel does not exist");
    uint256 latestIndex = pixels[tokenId].color.length - 1;
    string memory latestColor = pixels[tokenId].color[latestIndex];
    uint256 latestTimestamp = pixels[tokenId].editTimestamp[latestIndex];
    uint8 latestEditedByHuman = pixels[tokenId].editedByHuman[latestIndex];

    return string(
        abi.encodePacked(
            'data:application/json;utf8,{ "name": "Copix #"', tokenId, 
            '"color": "', latestColor,
            '", "timestamp": ', latestTimestamp,
            '", "lastEditedbyHuman": ', latestEditedByHuman,
            ' }'
        )); 
  }

  // Helper function to convert uint256 to string
  function uint256ToString(uint256 value) internal pure returns (string memory) {
      if (value == 0) {
          return "0";
      }

      uint256 temp = value;
      uint256 digits;

      while (temp != 0) {
          digits++;
          temp /= 10;
      }

      bytes memory buffer = new bytes(digits);
      uint256 index = digits - 1;
      temp = value;

      while (temp != 0) {
          buffer[index--] = bytes1(uint8(48 + temp % 10));
          temp /= 10;
      }

      return string(buffer);
  }

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

  function getTokenId() public view returns (uint256) {
      return _tokenId;
  }

  function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual override onlyContract {
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
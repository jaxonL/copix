// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Address.sol";

// WorldCoin integration
import { ByteHasher } from "./helpers/ByteHasher.sol";
import { IWorldID } from "./interfaces/IWorldID.sol";

contract Copix is ERC721, Ownable {
  using ByteHasher for bytes;
  using Strings for uint256;
  using Strings for uint8;
  using Address for address;

  uint256 private _tokenId;

  struct Pixel {
    uint256 tokenId;
    uint256[] editTimestamp;
    string[] color;
    uint8[] editedByHuman;
  }

  struct PixelData {
    uint256 x;
    uint256 y;
    string data;
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

  // next milestone
  // modifier onlyContract() {
  //   require(msg.sender == address(this), "Not the Copix contract");
  //   _;
  // }

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
    uint256 root, uint256 humanNullifierHash, uint256[8] calldata proof
  ) public {
    // sure why not let's keep this
    require(bytes(color).length == 7, "color must be a hex string of length 7");
    uint256 tokenId = _getTokenIdFromPixel(x, y);

    uint8 humanityCode = _verifyHumanity(root, humanNullifierHash, proof);

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

  /**
   * safe as paint, but without the verification because sad times
   */
  function unsafePaint(
    uint256 x, uint256 y, string calldata color,
    uint256 humanNullifierHash
  ) public {
    // sure why not let's keep this
    require(bytes(color).length == 7, "color must be a hex string of length 7");
    uint256 tokenId = _getTokenIdFromPixel(x, y);

    uint8 humanityCode = 0;

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
    require(x < canvasWidth, "x must be less than canvas width limit");
    require(y < canvasHeight, "y must be less than canvas height limit");
    
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
  function tokenURI(uint256 tokenId) public override view returns (string memory) {
    require(tokenId < canvasHeight * canvasWidth, "Pixel does not exist");

    return string(
      abi.encodePacked(
        'data:application/json;utf8,', tokenData(tokenId)
      )
    );
  }

  function tokenData(uint256 tokenId) public view returns (string memory) {
    require(tokenId < canvasHeight * canvasWidth, "Pixel does not exist");

    if (pixels[tokenId].color.length == 0) {
      return string(
        abi.encodePacked(
          '{ "name": "Copix #', tokenId.toString(), 
          '", "color": "#ffffff", "timestamp": 0, "lastEditedbyHuman": 0,"image": "',
          getSvgImage('#ffffff'),
        '", "description": "CoPix is a decentralized canvas where anyone can paint a pixel.", "external_url": "https://copix-loo.vercel.app/" }'
        )
      ); 
    }
    uint256 latestIndex = pixels[tokenId].color.length - 1;
    string memory latestColor = pixels[tokenId].color[latestIndex];
    uint256 latestTimestamp = pixels[tokenId].editTimestamp[latestIndex];
    uint8 latestEditedByHuman = pixels[tokenId].editedByHuman[latestIndex];

    return string(
      abi.encodePacked(
        '{ "name": "Copix #', tokenId.toString(), 
        '", "color": "', latestColor,
        '", "timestamp": ', latestTimestamp.toString(),
        ', "lastEditedbyHuman": ', latestEditedByHuman.toString(),
        ', "image": "', getSvgImage(latestColor),
        '", "description": "CoPix is a decentralized canvas where anyone can paint a pixel.\\nThis pixel was last painted on ', latestTimestamp.toString(),
        ' by ', latestEditedByHuman == 1 ? 'a phone-verified' : latestEditedByHuman == 2 ? 'an orb-verified' : 'an', ' address."',
        ', "attributes": [{ "trait_type": "Color", "value": "', latestColor, '"},{ "trait_type": "Timestamp", "display_type": "number", "value": ', latestTimestamp.toString(), '}],"external_url": "https://copix-loo.vercel.app/"}'
      )
    ); 
  }

  function getSvgImage(string memory color) public pure returns (string memory) {
    return string(
      abi.encodePacked(
        'data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"100\\" height=\\"100\\"><rect width=\\"100%\\" height=\\"100%\\" fill=\\"', color, '\\"/></svg>'
      )
    );
  }

  function currentState() public view returns (string[] memory) {
    string[] memory state = new string[](canvasWidth * canvasHeight);
    uint index = 0;
    for (uint256 j = 0; j < canvasHeight; j++) {
      for (uint256 i = 0; i < canvasWidth; i++) {
        uint256 tokenId = _getTokenIdFromPixel(i, j);
        string memory latestColor = "#ffffff";
        if (pixels[tokenId].color.length != 0) {
          latestColor = pixels[tokenId].color[pixels[tokenId].color.length - 1];
         }
        // string memory data = tokenData(tokenId);
        state[index] = latestColor;
        index++;
      }
    }
    return state;
  }

  /**
   * verifies humanity of user using worldcoin
   * @param root The root of the Merkle tree (returned by the JS widget).
   * @param nullifierHash The nullifier hash for this proof, preventing double signaling (returned by the JS widget).
   * @param proof The zero-knowledge proof that demonstrates the claimer is registered with World ID (returned by the JS widget).
   */
  function _verifyHumanity(
      uint256 root,
      uint256 nullifierHash,
      uint256[8] calldata proof
  ) private returns (uint8) {
    // We now verify the provided proof is valid and the user is verified by World ID
    verifyHumanityCheck(
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
      uint256 root,
      uint256 nullifierHash,
      uint256[8] calldata proof
  ) public view {
    // We now verify the provided proof is valid and the user is verified by World ID
    try worldId.verifyProof(root,
      groupId_human, // always verify is human
      1, // signal hash is always 1
      nullifierHash,
      externalNullifier,
      proof) {
      
    } catch Error(string memory reason) {
      revert(string(abi.encodePacked("verifyProof() failed: ", reason)));
    }
  }

  function getTokenId() public view returns (uint256) {
      return _tokenId;
  }

  // function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual override onlyContract {
  //   super.safeTransferFrom(from, to, tokenId, _data);
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

  /** override for ownerOf function */
  function ownerOf(uint256 tokenId) public view virtual override returns (address) {
    address owner = tokenIdToOwner[tokenId];
    require(owner != address(0), "ERC721: owner query for nonexistent token");
    return owner;
  }
}

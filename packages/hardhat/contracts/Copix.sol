// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Copix is ERC721, Ownable {
  uint256 private _tokenId;

  struct Pixel {
    uint tokenId;
    uint256[] editTimestamp;
    string[] color;
    uint[] editedByHuman;
  }

  // State Variables
  address public immutable owner;
  uint256 public immutable cooldownTime; // in seconds
  uint256 public immutable canvasWidth;
  uint256 public immutable canvasHeight;

  string public greeting = "Building Unstoppable Apps!!!";
  bool public premium = false;
  uint256 public totalCounter = 0;
  mapping(string => uint) public lastEditTime;
  mapping(string => uint) public humanEdits;
  mapping(uint256 => address) public tokenIdToOwner; // similar to _owners

  // Events: a way to emit log statements from smart contract that can be listened to by external parties
  event GreetingChange(address indexed greetingSetter, string newGreeting, bool premium, uint256 value);

  // Modifier: used to define a set of rules that must be met before or after a function is executed
  // Check the withdraw() function
  modifier isOwner() {
      // msg.sender: predefined variable that represents address of the account that called the current function
      require(msg.sender == owner, "Not the Owner");
      _;
  }

  // Constructor: Called once on contract deployment
  // Check packages/hardhat/deploy/00_deploy_your_contract.ts
  constructor(address _owner, uint256 _cooldownTime, uint256 _width, uint256 _height) ERC721("Copix", "CPX") {
    owner = _owner;
    cooldownTime = _cooldownTime;
    canvasWidth = _width;
    canvasHeight = _height;
  }

  function paint(uint x, uint y, string memory color, string memory humanNullifierHash) public {
    // sure why not let's keep this
    require(bytes(color).length == 7, "color must be a hex string of length 7");
    uint tokenId = _getTokenIdFromPixel(x, y);

    // TODO: pass in appropriate values
    uint humanityCode = verifyHumanity();

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


  function _getTokenIdFromPixel(uint x, uint y) private pure returns (uint256) {
    // TODO: check less than width/height
    require(x >= canvasWidth, "x must be less than canvas width limit");
    require(y >= canvasHeight, "y must be less than canvas height limit");
    
    return ((y * canvasWidth) + x);
  }

  // TODO: sybil resistance from world coin
  // return: human nullifier hash
  function verifyHumanity() private pure returns (uint256){
    // revert if not human ?
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
      (bool success,) = owner.call{value: address(this).balance}("");
      require(success, "Failed to send Ether");
  }

  /**
   * Function that allows the contract to receive ETH
   */
  receive() external payable {}
}
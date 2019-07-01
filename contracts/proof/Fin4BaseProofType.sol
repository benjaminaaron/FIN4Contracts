pragma solidity ^0.5.0;

import "contracts/Fin4TokenStrut.sol";

contract Fin4BaseProofType {

  string private name;
  string private description;
  address[] public tokensUsingThisProofType;

  constructor(string memory _name, string memory _description) public {
      name = _name;
      description = _description;
    }

  function getName() public view returns(string memory) {
    return name;
  }

  function getDescription() public view returns(string memory) {
    return description;
  }

  function getInfo() public view returns(string memory, string memory) {
    return (name, description);
  }

  function _sendApproval(address tokenAdrToReceiveProof, uint claimId) internal returns(bool) {
    // private ensures it can only be called from within this SC?
    Fin4TokenStrut(tokenAdrToReceiveProof).receiveProofApproval(msg.sender, claimId);
    return true;
  }

  function registerTokenUsingThisProofType(address token) public returns(bool) {
    tokensUsingThisProofType.push(token);
    return true;
  }

}

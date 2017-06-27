pragma solidity ^0.4.10;

contract PolicyInvestable {
  function invest() payable returns (bool success);
  function getInvestment() constant returns(uint);

  event Invested(uint value);
}
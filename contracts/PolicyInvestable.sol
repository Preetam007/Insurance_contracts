pragma solidity ^0.4.10;

contract PolicyInvestable {
  function invest() payable returns (bool success);
  function investd() payable returns (bool success);

  event Invested(uint value);
}

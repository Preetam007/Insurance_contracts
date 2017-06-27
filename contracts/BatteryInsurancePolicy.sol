pragma solidity ^0.4.10;

import "./PolicyInvestable.sol";

contract BatteryInsurancePolicy is PolicyInvestable { 
  mapping (address => PolicyData) insurancePolicies;
  mapping (address => uint) investors;

  struct PolicyData {
        DeviceData device;
        uint endDateTimestamp;
        uint insurancePrice;
        uint maxPayout;
    }

    struct DeviceData {
      uint itemId;
      string deviceName;
      uint deviceYear;
      uint currentBatteryCapacity;
    }

  function BatteryInsurancePolicy() {
  }

  // fallback functon, send all ethers as investment
  function() payable { 
    this.invest();
  }

  function invest() payable returns (bool success) {
    if (msg.value == 0) {
      throw;
    }

    investors[msg.sender] = investors[msg.sender] + msg.value;
    Invested(msg.value);
    return true;
  }

  function getInvestment() constant returns(uint) {
    return investors[msg.sender];
  }


  // More parameters should be included
  function policyPrice(uint currentBatteryCapacity) constant returns(uint price) {
    uint basePrice = 10 finney;
    uint oneFinney = 1 finney;
    uint premium = ((100 - currentBatteryCapacity) / 2) * oneFinney;
    uint policyPrice = basePrice + premium;
    return policyPrice;
  }


  function insure(uint itemId, uint deviceYear, uint currentBatteryCapacity, string deviceName) payable returns (bool insured) {
    uint price = policyPrice(currentBatteryCapacity);
    if (msg.value < price) {
      throw;
    }

    var deviceData = DeviceData(itemId, deviceName, deviceYear, currentBatteryCapacity);
    uint maxPayout = getMaxPayout();
    var policy = PolicyData(deviceData, now + 30 days, price, maxPayout);

    insurancePolicies[msg.sender] = policy;

    return true;
  }

  function claim() returns (bool) {
    var userPolicy = insurancePolicies[msg.sender];

    if(userPolicy.endDateTimestamp == 0) {
      throw;
    } else {
      if(this.balance > userPolicy.maxPayout) {
        msg.sender.transfer(userPolicy.maxPayout);
        return true;
      }

      return false;
    }
  }

  function getMaxPayout() constant returns (uint price) {
    uint maxPayout = 100 finney;

    return maxPayout;
  }

    // Returns policy end date timestamp
  function getPolicyEndDate() constant returns(uint) {
    var userPolicy = insurancePolicies[msg.sender];
    if (userPolicy.endDateTimestamp != 0) {
      return (userPolicy.endDateTimestamp);
    }
    else {
      return 0;
    }
  }

}
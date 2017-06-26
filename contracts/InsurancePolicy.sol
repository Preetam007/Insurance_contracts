pragma solidity ^0.4.10;

contract InsurancePolicy {
  mapping (address => Policy[]) insurancePolicies;
  mapping (address => uint) investedEth;

  enum DeviceType { Phone, Watch, HomeControl }

  struct Policy {
        DeviceData device;
        uint endDateTimestamp;
        uint insurancePrice;
        uint maxPayout;
    }

    struct DeviceData {
      uint itemId;
      DeviceType deviceType;
      string deviceName;
      uint deviceYear;
      uint currentBatteryCapacity;
    }

  function InsurancePolicy() {
  }

  // fallback functon, send all ethers as investment
  function() payable { 
    this.invest(msg.value);
  }

  // Returns only first policy end date timestamp, should return a list with full insurance policies data
  function getPolicies() constant returns(uint) {
    var userPolicies = insurancePolicies[msg.sender];
    if (userPolicies.length > 0) {
      return (userPolicies[0].endDateTimestamp);
    }
    else {
      return 0;
    }
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

    var deviceData = DeviceData(itemId, DeviceType.Phone, deviceName, deviceYear, currentBatteryCapacity);
    uint maxPayout = calculateMaxPayout(deviceYear);
    var policy = Policy(deviceData, now + 30 days, price, maxPayout);

    insurancePolicies[msg.sender].push(policy);

    return true;
  }

  function invest(uint investment) {
    investedEth[msg.sender] = investedEth[msg.sender] + investment;
  }

  function claim() returns (bool) {
    var userPolicies = insurancePolicies[msg.sender];
    if(userPolicies.length < 0) {
      throw;
    } else {
      if(this.balance > userPolicies[0].maxPayout) {
        msg.sender.transfer(userPolicies[0].maxPayout);
        return true;
      }

      return false;
    }
  }

  function calculateMaxPayout(uint deviceYear) constant returns (uint price) {
    uint maxPayout = 100 finney;

    return (maxPayout - (2017 - deviceYear) * 5);
  }

}
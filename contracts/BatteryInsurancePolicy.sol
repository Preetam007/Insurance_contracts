pragma solidity ^0.4.10;

import "./PolicyInvestable.sol";

contract BatteryInsurancePolicy is PolicyInvestable { 

  // Investment data
  mapping (address => uint) public investors;
  uint public totalInvestorsCount;
  uint public totalInvestedAmount;
  uint public totalInsurers;
  uint public totalClaimsPaid;

  // Insurance data
  mapping (address => PolicyData) insurancePolicies;
  mapping (string => mapping(string => uint) ) insuranceParameters;
  uint public basePremium;
  uint public maxPayout;
  uint loading;

  // Owner is used to confirm policies and claims which came via our server
  address owner = 0x2033d81c062dE642976300c6eabCbA149e4372BE;

  event Insured(string deviceName, uint insurancePrice);
  event Claimed(uint payout); 

  struct PolicyData {
        DeviceData device;
        uint endDateTimestamp;
        uint nextPaymentTimestamp;
        uint monthlyPayment;
        uint maxPayout;
        uint totalPrice;
        string region;
        bool claimed;
        bool confirmed;
  }

  struct DeviceData {
    string itemId;
    string deviceBrand;
    string deviceYear;
    string batteryWearLevel;
  }

  function BatteryInsurancePolicy() payable {
    // Initial funds
    investors[msg.sender] = investors[msg.sender] + msg.value;
    totalInvestorsCount++;
    totalInvestedAmount = totalInvestedAmount + msg.value;
    Invested(msg.value);

    setInitialInsuranceParameters();
  }

  function setInitialInsuranceParameters() internal {
    // Device brand
    insuranceParameters['deviceBrand']['apple'] = 100;
    insuranceParameters['deviceBrand']['samsung'] = 110;
    insuranceParameters['deviceBrand']['default'] = 120;

    // Device year
    insuranceParameters['deviceYear']['2014'] = 120;
    insuranceParameters['deviceYear']['2015'] = 110;
    insuranceParameters['deviceYear']['2016'] = 100;
    insuranceParameters['deviceYear']['2017'] = 100;
    insuranceParameters['deviceYear']['default'] = 140;

    // Battery wear level upper than
    insuranceParameters['wearLevel']['50'] = 150;
    insuranceParameters['wearLevel']['60'] = 140;
    insuranceParameters['wearLevel']['70'] = 120;
    insuranceParameters['wearLevel']['80'] = 110;
    insuranceParameters['wearLevel']['90'] = 100;

    // Region
    insuranceParameters['region']['usa'] = 100;
    insuranceParameters['region']['europe'] = 100;
    insuranceParameters['region']['africa'] = 120;
    insuranceParameters['region']['default'] = 130;

    // Base premium (0.001 ETH)
    basePremium = 1000000000000000;

    // Max payout (0.008 ETH)
    maxPayout = 8000000000000000;

    // Loading percentage (expenses, etc)
    loading = 50;
  }

  // fallback functon not to take ethers
  function() payable { 
    throw;
  }

  function invest() payable returns (bool success) {
    if (msg.value == 0) {
      throw;
    }

    investors[msg.sender] = investors[msg.sender] + msg.value;
    totalInvestorsCount++;
    totalInvestedAmount = totalInvestedAmount + msg.value;
    Invested(msg.value);
    return true;
  }


  // More parameters should be included
  function policyPrice(string deviceBrand, string deviceYear, string wearLevel, string region) constant returns(uint price) {
    // set defaults
    uint deviceBrandMultiplier = insuranceParameters['deviceBrand']['default'];
    uint deviceYearMultiplier = insuranceParameters['deviceYear']['default'];
    uint batteryWearLevelMultiplier = insuranceParameters['wearLevel']['default'];
    uint regionMultiplier = insuranceParameters['region']['default'];

    if(insuranceParameters['deviceBrand'][deviceBrand] != 0) {
      deviceBrandMultiplier = insuranceParameters['deviceBrand'][deviceBrand];
    }
    if(insuranceParameters['deviceYear'][deviceYear] != 0) {
      deviceYearMultiplier = insuranceParameters['deviceYear'][deviceYear];
    }
    if(insuranceParameters['wearLevel'][wearLevel] != 0) {
      batteryWearLevelMultiplier = insuranceParameters['wearLevel'][wearLevel];
    }
    if(insuranceParameters['region'][region] != 0) {
      deviceBrandMultiplier = insuranceParameters['region'][region];
    }

    // / 100 is due to Solidity not supporting doubles
    uint riskPremium = basePremium * deviceBrandMultiplier / 100 * deviceYearMultiplier / 100 
                        * batteryWearLevelMultiplier / 100 * regionMultiplier / 100;

    uint officePremium = riskPremium / (100 - loading) * 100; 
    return officePremium;
  }


  function insure(string itemId, string deviceBrand, string deviceYear, string wearLevel, string region) payable returns (bool insured) {
    uint totalPrice = policyPrice(deviceBrand, deviceYear, wearLevel, region);
    uint monthlyPayment = totalPrice / 12;
    if (msg.value < monthlyPayment) {
      throw;
    }

    var deviceData = DeviceData(itemId, deviceBrand, deviceYear, wearLevel);
    var policy = PolicyData(deviceData, now + 1 years, now + 30 days, monthlyPayment, maxPayout, totalPrice, region, false, false);

    insurancePolicies[msg.sender] = policy;
    totalInsurers = totalInsurers + 1;

    Insured(deviceBrand, msg.value);
    return true;
  }

  function confirmPolicy(address policyOwner) {
    if(owner != msg.sender) {
      throw;
    }

    insurancePolicies[policyOwner].confirmed = true;
  }

  function claim(uint wearLevel) returns (bool) {
    var userPolicy = insurancePolicies[msg.sender];

    if(wearLevel < 70 && userPolicy.endDateTimestamp != 0 && !userPolicy.claimed && userPolicy.endDateTimestamp > now && userPolicy.confirmed) {
      if(this.balance > userPolicy.maxPayout) {
        msg.sender.transfer(userPolicy.maxPayout);
        userPolicy.claimed = true;
        userPolicy.endDateTimestamp = now;
        userPolicy.nextPaymentTimestamp = 0;

        totalClaimsPaid = totalClaimsPaid + userPolicy.maxPayout;
        Claimed(userPolicy.maxPayout);
        return true;
      }
      // Due to proposed statisticl model in production app this should never happen
      return false;
    } else {
      throw;
    }
  }

  function getPolicyEndDateTimestamp() constant returns (uint) {
    return insurancePolicies[msg.sender].endDateTimestamp;
  }

  function getPolicyNextPayment() constant returns (uint) {
    return insurancePolicies[msg.sender].nextPaymentTimestamp;
  }

  function claimed() constant returns (bool) {
    return insurancePolicies[msg.sender].claimed;
  }





}
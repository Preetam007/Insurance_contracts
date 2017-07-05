var BatteryInsurancePolicy = artifacts.require("./BatteryInsurancePolicy.sol");

module.exports = function(deployer) {
  deployer.deploy(BatteryInsurancePolicy);
};

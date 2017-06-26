var InsurancePolicy = artifacts.require("./InsurancePolicy.sol");

module.exports = function(deployer) {
  deployer.deploy(InsurancePolicy);
};

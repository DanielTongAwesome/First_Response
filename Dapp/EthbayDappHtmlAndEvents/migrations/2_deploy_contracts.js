const Ethbay = artifacts.require("Ethbay");

module.exports = function(deployer) {
  deployer.deploy(Ethbay);
};

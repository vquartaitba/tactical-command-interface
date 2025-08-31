require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    lisk_sepolia: {
      url: process.env.LISK_SEPOLIA_RPC || "https://rpc.sepolia-api.lisk.com",
      accounts: [process.env.PRIVATE_KEY].filter(Boolean),
      chainId: 4202,
    },
    filecoin_calibration: {
      url: "https://api.calibration.node.glif.io/rpc/v1",
      chainId: 314159,
      accounts: [process.env.PRIVATE_KEY].filter(Boolean), // la pk que tiene TFIL
    },
  },
};

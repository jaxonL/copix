import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
// import { WORLD_APP_CONTRACT, WORLD_APP_ID, WORLD_APP_SIGNAL } from "./constants";

// // modify this to change the chain id
// const chainId = 80001;
const canvasWidth = 30;
const canvasHeight = 20;
const timeoutInSeconds = 30;

/**
 * Deploys a contract named "Copix" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployCopix: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network goerli`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Copix", {
    from: deployer,
    // Contract constructor arguments
    args: [
      timeoutInSeconds,
      canvasWidth,
      canvasHeight,
      "0x719683F13Eeea7D84fCBa5d7d17Bf82e03E3d260",
      "app_staging_72489f615991623242b7bdc82eb8618e",
      "paint",
    ],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract
  // const copixContract = await hre.ethers.getContract("Copix", deployer);
};

export default deployCopix;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags Copix
deployCopix.tags = ["Copix"];

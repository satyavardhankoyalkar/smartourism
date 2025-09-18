import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const TouristIDRegistry = await ethers.getContractFactory("TouristIDRegistry");
  const registry = await TouristIDRegistry.deploy(deployer.address, "TouristID", "TID");
  await registry.waitForDeployment();
  const address = await registry.getAddress();
  console.log("TouristIDRegistry deployed:", address);

  // Grant deployer as issuer and responder for testing
  const grantIssuerTx = await registry.grantIssuer(deployer.address);
  await grantIssuerTx.wait();
  const grantResponderTx = await registry.grantResponder(deployer.address);
  await grantResponderTx.wait();
  console.log("Roles granted to deployer (issuer,responder)");

  // Persist address for scripts
  const out = { network: (await deployer.provider?.getNetwork())?.name ?? "hardhat", address };
  const outPath = path.join(process.cwd(), ".deployed-local.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log("Wrote", outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



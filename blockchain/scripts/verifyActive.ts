import { ethers } from "hardhat";

async function main() {
  const registryAddress = process.env.REGISTRY_ADDRESS as string;
  const holder = process.env.HOLDER as string;
  if (!registryAddress || !holder) throw new Error("REGISTRY_ADDRESS and HOLDER required");

  const registry = await ethers.getContractAt("TouristIDRegistry", registryAddress);
  const isActive = await registry.verifyAddressActive(holder);
  const tokenId = await registry.getActiveTokenId(holder);
  console.log(JSON.stringify({ isActive, tokenId: tokenId.toString() }));
}

main().catch((e) => { console.error(e); process.exitCode = 1; });



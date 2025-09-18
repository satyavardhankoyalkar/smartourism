import { ethers } from "hardhat";

async function main() {
  const registryAddress = process.env.REGISTRY_ADDRESS as string;
  const tokenIdStr = process.env.TOKEN_ID as string;
  if (!registryAddress || !tokenIdStr) throw new Error("REGISTRY_ADDRESS and TOKEN_ID required");
  const tokenId = BigInt(tokenIdStr);

  const registry = await ethers.getContractAt("TouristIDRegistry", registryAddress);
  const tx = await registry.revokeID(tokenId);
  const receipt = await tx.wait();
  console.log("Revoked, tx:", receipt?.hash);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });



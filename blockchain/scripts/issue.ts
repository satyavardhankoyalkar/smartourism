import { ethers } from "hardhat";

async function main() {
  const registryAddress = process.env.REGISTRY_ADDRESS as string;
  if (!registryAddress) throw new Error("REGISTRY_ADDRESS missing");

  const [issuer] = await ethers.getSigners();
  const registry = await ethers.getContractAt("TouristIDRegistry", registryAddress);

  const now = Math.floor(Date.now() / 1000);
  const kycHash = ethers.keccak256(ethers.toUtf8Bytes("sample-kyc-ref"));
  const tx = await registry.issueID(
    issuer.address,
    kycHash,
    "Delhi-Agra-Jaipur",
    "+91-9000000000",
    "IN",
    now,
    now + 7 * 24 * 3600,
    true,
    80
  );
  const receipt = await tx.wait();
  console.log("Issued, tx:", receipt?.hash);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });



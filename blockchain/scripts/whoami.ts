import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log(signer.address);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });



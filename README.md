# 🦞 Clawd PFP — NFT Collection with CLAWD Burn Matching

**Live:** [pfp.clawdbotatg.eth.limo](https://pfp.clawdbotatg.eth.limo)

A PFP NFT collection on Base where you mint with ETH and matching $CLAWD gets burned from the contract treasury. Fund development without selling tokens.

## How It Works

1. **💰 Pay ETH** — Mint price is 0.001 ETH per NFT. ETH goes to the dev fund.
2. **🔥 CLAWD Burns** — Each mint burns 10,000 CLAWD from the contract's burn treasury. Tokens are sent to the dead address — gone forever.
3. **🎨 Get Your PFP** — You receive a unique ERC-721 NFT with custom art stored on IPFS.

## Contract Details

- **Network:** Base (Chain ID 8453)
- **Contract:** [`0x8606551d2be495503fbf23f50bbfd307385e9bdf`](https://basescan.org/address/0x8606551d2be495503fbf23f50bbfd307385e9bdf)
- **CLAWD Token:** [`0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07`](https://basescan.org/token/0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07)
- **Max Supply:** 1,000 PFPs
- **Mint Price:** 0.001 ETH
- **Burn per Mint:** 10,000 CLAWD

## Features

- ERC-721 NFTs with per-token metadata (IPFS)
- Batch mint (1-10 at a time)
- Admin-adjustable mint price and burn amount
- Admin deposits/withdraws CLAWD treasury
- Full stats: total minted, CLAWD burned, treasury remaining
- USD values via DexScreener API
- Wallet connect via RainbowKit

## Developer Quickstart

```bash
git clone https://github.com/clawdbotatg/clawd-pfp-nft.git
cd clawd-pfp-nft
yarn install
yarn fork --network base
yarn deploy
yarn start
```

## Stack

- [Scaffold-ETH 2](https://github.com/scaffold-eth/se-2)
- Solidity + Foundry
- Next.js + TypeScript
- RainbowKit + wagmi
- Base (L2)
- BuidlGuidl IPFS

---

Built by [Clawd](https://twitter.com/clawdbotatg) 🦞

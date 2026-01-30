"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { formatEther, parseEther } from "viem";
import { base } from "viem/chains";
import type { NextPage } from "next";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useFetchNativeCurrencyPrice } from "@scaffold-ui/hooks";
import { Address } from "@scaffold-ui/components";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

const CLAWD_TOKEN_ADDRESS = "0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07";

// Placeholder PFP images — colorful grid
const PFP_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#FF7F50", "#87CEEB", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#F1948A", "#82E0AA", "#F8C471",
  "#D2B4DE", "#AED6F1", "#F5B7B1", "#A9DFBF", "#FAD7A0",
];

const Home: NextPage = () => {
  const { address: connectedAddress, chain } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const { switchChain } = useSwitchChain();
  const { price: ethPrice } = useFetchNativeCurrencyPrice();
  const [clawdPrice, setClawdPrice] = useState<number>(0);
  const [mintCount, setMintCount] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const wrongNetwork = chain?.id !== targetNetwork.id;

  // Fetch CLAWD price from DexScreener
  useEffect(() => {
    const fetchClawdPrice = async () => {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CLAWD_TOKEN_ADDRESS}`);
        const data = await res.json();
        if (data.pairs && data.pairs.length > 0) {
          setClawdPrice(parseFloat(data.pairs[0].priceUsd) || 0);
        }
      } catch (e) {
        console.error("Failed to fetch CLAWD price", e);
      }
    };
    fetchClawdPrice();
    const interval = setInterval(fetchClawdPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  // Contract reads
  const { data: mintPrice } = useScaffoldReadContract({
    contractName: "ClawdPFP",
    functionName: "mintPrice",
  });

  const { data: burnAmountPerMint } = useScaffoldReadContract({
    contractName: "ClawdPFP",
    functionName: "burnAmountPerMint",
  });

  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "ClawdPFP",
    functionName: "totalMinted",
  });

  const { data: totalClawdBurned } = useScaffoldReadContract({
    contractName: "ClawdPFP",
    functionName: "totalClawdBurned",
  });

  const { data: clawdTreasury } = useScaffoldReadContract({
    contractName: "ClawdPFP",
    functionName: "clawdTreasury",
  });

  const { data: maxSupply } = useScaffoldReadContract({
    contractName: "ClawdPFP",
    functionName: "maxSupply",
  });

  const { data: mintActive } = useScaffoldReadContract({
    contractName: "ClawdPFP",
    functionName: "mintActive",
  });

  const { data: contractOwner } = useScaffoldReadContract({
    contractName: "ClawdPFP",
    functionName: "owner",
  });

  const { writeContractAsync } = useScaffoldWriteContract("ClawdPFP");

  // Format helpers
  const formatClawd = (amount: bigint | undefined) => {
    if (!amount) return "0";
    const num = Number(formatEther(amount));
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const formatUsd = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const mintPriceEth = mintPrice ? Number(formatEther(mintPrice)) : 0;
  const totalCostEth = mintPriceEth * mintCount;
  const totalCostUsd = totalCostEth * (ethPrice || 0);
  const burnPerMintClawd = burnAmountPerMint ? Number(formatEther(burnAmountPerMint)) : 0;
  const totalBurnClawd = burnPerMintClawd * mintCount;
  const totalBurnUsd = totalBurnClawd * clawdPrice;

  const handleMint = useCallback(async () => {
    if (!mintPrice) return;
    setIsMinting(true);
    try {
      if (mintCount === 1) {
        await writeContractAsync({
          functionName: "mint",
          value: mintPrice,
        });
      } else {
        await writeContractAsync({
          functionName: "mintBatch",
          args: [BigInt(mintCount)],
          value: mintPrice * BigInt(mintCount),
        });
      }
    } catch (e) {
      console.error("Mint failed:", e);
    } finally {
      setIsMinting(false);
    }
  }, [mintPrice, mintCount, writeContractAsync]);

  const handleSwitchNetwork = useCallback(async () => {
    setIsSwitching(true);
    try {
      switchChain({ chainId: targetNetwork.id });
    } catch (e) {
      console.error("Network switch failed:", e);
    } finally {
      setIsSwitching(false);
    }
  }, [switchChain, targetNetwork.id]);

  const remainingSupply = maxSupply && totalMinted !== undefined
    ? Number(maxSupply) === 0 ? "∞" : `${Number(maxSupply) - Number(totalMinted)}`
    : "—";

  const isOwner = connectedAddress && contractOwner && connectedAddress.toLowerCase() === contractOwner.toLowerCase();

  return (
    <div className="flex flex-col items-center gap-8 py-8 px-4 max-w-6xl mx-auto">
      {/* Stats Bar */}
      <div className="stats stats-vertical md:stats-horizontal shadow w-full bg-base-200">
        <div className="stat">
          <div className="stat-title">Total Minted</div>
          <div className="stat-value text-primary">{totalMinted?.toString() ?? "0"}</div>
          <div className="stat-desc">
            {maxSupply && Number(maxSupply) > 0
              ? `of ${Number(maxSupply).toLocaleString()} max`
              : "Unlimited supply"}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">🔥 CLAWD Burned</div>
          <div className="stat-value text-error">{formatClawd(totalClawdBurned)}</div>
          <div className="stat-desc">
            {totalClawdBurned ? formatUsd(Number(formatEther(totalClawdBurned)) * clawdPrice) : "$0.00"} USD
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">🏦 Burn Treasury</div>
          <div className="stat-value text-success">{formatClawd(clawdTreasury)}</div>
          <div className="stat-desc">
            {clawdTreasury ? formatUsd(Number(formatEther(clawdTreasury)) * clawdPrice) : "$0.00"} USD
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Remaining</div>
          <div className="stat-value">{remainingSupply}</div>
          <div className="stat-desc">NFTs left to mint</div>
        </div>
      </div>

      {/* Mint Section */}
      <div className="card bg-base-200 shadow-xl w-full max-w-md">
        <div className="card-body items-center text-center">
          <h2 className="card-title text-2xl">Mint Your PFP</h2>
          <p className="text-base-content/70 text-sm mb-2">
            Each mint burns <span className="font-bold text-error">{burnPerMintClawd.toLocaleString()} CLAWD</span>
            {clawdPrice > 0 && <span className="text-xs"> (~{formatUsd(burnPerMintClawd * clawdPrice)})</span>}
          </p>

          {/* Mint count selector */}
          <div className="flex items-center gap-4 mb-4">
            <button
              className="btn btn-circle btn-sm btn-outline"
              onClick={() => setMintCount(Math.max(1, mintCount - 1))}
              disabled={mintCount <= 1}
            >
              −
            </button>
            <span className="text-3xl font-bold w-12 text-center">{mintCount}</span>
            <button
              className="btn btn-circle btn-sm btn-outline"
              onClick={() => setMintCount(Math.min(10, mintCount + 1))}
              disabled={mintCount >= 10}
            >
              +
            </button>
          </div>

          {/* Cost breakdown */}
          <div className="bg-base-300 rounded-lg p-3 w-full mb-4 text-sm">
            <div className="flex justify-between">
              <span>ETH Cost:</span>
              <span className="font-mono">
                {totalCostEth.toFixed(4)} ETH
                {ethPrice > 0 && <span className="text-xs text-base-content/60"> (~{formatUsd(totalCostUsd)})</span>}
              </span>
            </div>
            <div className="flex justify-between text-error">
              <span>🔥 CLAWD Burned:</span>
              <span className="font-mono">
                {totalBurnClawd.toLocaleString()}
                {clawdPrice > 0 && <span className="text-xs text-base-content/60"> (~{formatUsd(totalBurnUsd)})</span>}
              </span>
            </div>
          </div>

          {/* Mint button — network switch → mint flow */}
          {!connectedAddress ? (
            <p className="text-base-content/50 text-sm">Connect wallet to mint</p>
          ) : wrongNetwork ? (
            <button
              className="btn btn-primary btn-lg w-full"
              onClick={handleSwitchNetwork}
              disabled={isSwitching}
            >
              {isSwitching ? (
                <><span className="loading loading-spinner loading-sm"></span> Switching...</>
              ) : (
                "Switch to Base"
              )}
            </button>
          ) : !mintActive ? (
            <button className="btn btn-disabled btn-lg w-full" disabled>
              Minting Paused
            </button>
          ) : (
            <button
              className="btn btn-primary btn-lg w-full"
              onClick={handleMint}
              disabled={isMinting}
            >
              {isMinting ? (
                <><span className="loading loading-spinner loading-sm"></span> Minting...</>
              ) : (
                `Mint ${mintCount} PFP${mintCount > 1 ? "s" : ""} for ${totalCostEth.toFixed(4)} ETH`
              )}
            </button>
          )}
        </div>
      </div>

      {/* PFP Gallery — placeholder colored squares */}
      <div className="w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Collection Preview</h2>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2">
          {PFP_COLORS.map((color, i) => {
            const minted = totalMinted ? i < Number(totalMinted) : false;
            return (
              <div
                key={i}
                className={`aspect-square rounded-lg border-2 flex items-center justify-center text-white font-bold text-xs
                  ${minted ? "border-primary opacity-50" : "border-base-300 hover:border-primary/50"}`}
                style={{ backgroundColor: color }}
                title={minted ? `PFP #${i + 1} — Minted` : `PFP #${i + 1} — Available`}
              >
                #{i + 1}
                {minted && <span className="absolute text-xs">✓</span>}
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm text-base-content/50 mt-2">
          Placeholder art — final PFP images will be added via IPFS
        </p>
      </div>

      {/* How It Works */}
      <div className="w-full bg-base-200 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-4xl mb-2">💰</div>
            <h3 className="font-bold">Pay ETH</h3>
            <p className="text-sm text-base-content/70">
              Mint price is {mintPriceEth} ETH per NFT
              {ethPrice > 0 && ` (~${formatUsd(mintPriceEth * ethPrice)})`}. ETH goes to the dev fund.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🔥</div>
            <h3 className="font-bold">CLAWD Burns</h3>
            <p className="text-sm text-base-content/70">
              Each mint burns {burnPerMintClawd.toLocaleString()} CLAWD from the contract treasury.
              Tokens are sent to the dead address — gone forever.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🎨</div>
            <h3 className="font-bold">Get Your PFP</h3>
            <p className="text-sm text-base-content/70">
              You receive a unique ERC-721 NFT. Each PFP has custom art stored on IPFS.
            </p>
          </div>
        </div>
      </div>

      {/* Contract Info */}
      <div className="w-full text-center text-sm text-base-content/50">
        <p>
          Contract Owner: {contractOwner ? <Address address={contractOwner} chain={targetNetwork} /> : "—"}
        </p>
        <p>
          CLAWD Token: <Address address={CLAWD_TOKEN_ADDRESS} chain={targetNetwork} />
        </p>
      </div>
    </div>
  );
};

export default Home;

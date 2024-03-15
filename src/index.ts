// cannister code goes here
import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

/**
 * `nftsStorage` - It's a key-value data structure that is used to store NFTs.
 * {@link StableBTreeMap} is a self-balancing tree that acts as a durable data storage that keeps data across canister upgrades.
 * For this contract, we've chosen {@link StableBTreeMap} as storage for the following reasons:
 * - `insert`, `get`, and `remove` operations have constant time complexity - O(1).
 * - Data stored in the map survives canister upgrades, unlike using HashMap where data is lost after upgrades.
 *
 * Breakdown of the `StableBTreeMap(string, NFT)` data structure:
 * - The key of the map is an `nftId`.
 * - The value in this map is an NFT itself `NFT` that is related to a given key (`nftId`).
 *
 * Constructor values:
 * 1) 0 - memory id where to initialize a map.
 */
 
/**
 * This type represents an NFT (Non-Fungible Token) that can be ranked based on rarity.
 */
class NFT {
   id: string;
   name: string;
   description: string;
   imageUrl: string;
   rarityScore: number;
   createdAt: Date;
   updatedAt: Date | null;
}

const nftsStorage = StableBTreeMap<string, NFT>(0);

export default Server(() => {
   const app = express();
   app.use(express.json());

   app.post("/nfts", (req, res) => {
      const nft: NFT = { id: uuidv4(), rarityScore: 0, createdAt: getCurrentDate(), ...req.body };
      nftsStorage.insert(nft.id, nft);
      res.json(nft);
   });

   app.get("/nfts", (req, res) => {
      const nfts = nftsStorage.values();
      const sortedNFTs = nfts.sort((a, b) => b.rarityScore - a.rarityScore); // Sort by rarity score descending
      res.json(sortedNFTs);
   });

   app.get("/nfts/:id", (req, res) => {
      const nftId = req.params.id;
      const nftOpt = nftsStorage.get(nftId);
      if ("None" in nftOpt) {
         res.status(404).send(`The NFT with id=${nftId} not found`);
      } else {
         res.json(nftOpt.Some);
      }
   });

   app.put("/nfts/:id", (req, res) => {
      const nftId = req.params.id;
      const nftOpt = nftsStorage.get(nftId);
      if ("None" in nftOpt) {
         res.status(400).send(`Couldn't update an NFT with id=${nftId}. NFT not found`);
      } else {
         const nft = nftOpt.Some;
         const updatedNFT = { ...nft, ...req.body, updatedAt: getCurrentDate() };
         nftsStorage.insert(nft.id, updatedNFT);
         res.json(updatedNFT);
      }
   });

   app.delete("/nfts/:id", (req, res) => {
      const nftId = req.params.id;
      const deletedNFT = nftsStorage.remove(nftId);
      if ("None" in deletedNFT) {
         res.status(400).send(`Couldn't delete an NFT with id=${nftId}. NFT not found`);
      } else {
         res.json(deletedNFT.Some);
      }
   });

   return app.listen();
});

function getCurrentDate() {
   const timestamp = new Number(ic.time());
   return new Date(timestamp.valueOf() / 1000_000);
}

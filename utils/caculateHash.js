import * as Crypto from "expo-crypto";

const calculateHash = async ({
  index,
  previousHash,
  createdAt,
  tx_userId,
  tx_voiceHash,
  tx_timeStamp,
}) =>
  await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    index + previousHash + createdAt + tx_userId + tx_voiceHash + tx_timeStamp
  );

export default calculateHash;

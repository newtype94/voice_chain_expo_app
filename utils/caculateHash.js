import * as CryptoJS from "crypto-js";

const calculateHash = ({
  index,
  previousHash,
  createdAt,
  tx_userId,
  tx_voiceHash,
  tx_timeStamp,
}) =>
  CryptoJS.SHA256(
    index + previousHash + createdAt + tx_userId + tx_voiceHash + tx_timeStamp
  ).toString();

export { calculateHash };

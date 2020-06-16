const url = {
  rest: "https://jylagc9o0j.execute-api.ap-northeast-2.amazonaws.com/prod",
  socket: "wss://0jh2jgfcub.execute-api.ap-northeast-2.amazonaws.com/Prod",
};

const genesisBlock = {
  idx: 1,
  createdAt: 1562000010000,
  hash: "firstBlockHash",
  previousHash: "none",
  tx_userId: "kyh",
  tx_voiceHash: "firstVoiceHash",
  tx_timeStamp: 1562000000000,
};

const createBlocksQuery =
  "create table if not exists blocks (idx integer primary key not null, createdAt int, hash text, previousHash text, tx_userId text, tx_voiceHash text, tx_timeStamp int)";
const insertQuery =
  "INSERT INTO blocks (idx, createdAt, hash, previousHash, tx_userId, tx_voiceHash, tx_timeStamp) VALUES (?, ?, ?, ?, ?, ?, ?)";

const createRecordsQuery =
  "create table if not exists records (idx integer primary key AUTOINCREMENT, name text not null)";

export {
  url,
  genesisBlock,
  createBlocksQuery,
  insertQuery,
  createRecordsQuery,
};

const addRequest = () => {
  const newBlock = {
    index: blocks.length + 1,
    hash: "to be calculated",
    previousHash: blocks[blocks.length - 1].hash,
    createdAt: new Date().getTime(),
    tx_userId: userId,
    tx_voiceHash: document.getElementById("MSG").value || "it_is_voice_hash",
    tx_timeStamp: new Date().getTime(),
  };
  newBlock.hash = calculateHash(newBlock);
  console.log(newBlock);
  wSocket.send(
    JSON.stringify({
      message: "add",
      data: newBlock,
    })
  );
};

export { addRequest };

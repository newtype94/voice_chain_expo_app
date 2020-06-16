import * as SQLite from "expo-sqlite";
import { createBlocksQuery, genesisBlock, createRecordsQuery } from "./config";
const db = SQLite.openDatabase("db.db");

function checkTable() {
  db.transaction((tx) => {
    tx.executeSql(createBlocksQuery);
    tx.executeSql(
      "INSERT INTO blocks VALUES (?, ?, ?, ?, ?, ?, ?)",
      Object.values(genesisBlock)
    );
  });
  db.transaction((tx) => {
    tx.executeSql(createRecordsQuery);
  });
}

function resetDB() {
  db.transaction((tx) => {
    tx.executeSql("DROP TABLE blocks");
    tx.executeSql(createBlocksQuery);
    tx.executeSql(
      "INSERT INTO blocks VALUES (?, ?, ?, ?, ?, ?, ?)",
      Object.values(genesisBlock)
    );
  });
}

export { checkTable, resetDB };

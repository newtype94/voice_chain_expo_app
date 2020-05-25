import * as SQLite from "expo-sqlite";
import { creatingQuery, genesisBlock } from "./config";
const db = SQLite.openDatabase("db.db");

function checkTable() {
  db.transaction((tx) => {
    tx.executeSql(creatingQuery);
    tx.executeSql(
      "INSERT INTO blocks VALUES (?, ?, ?, ?, ?, ?, ?)",
      Object.values(genesisBlock)
    );
  });
}

function resetDB() {
  db.transaction((tx) => {
    tx.executeSql("DROP TABLE blocks");
    tx.executeSql(creatingQuery);
    tx.executeSql(
      "INSERT INTO blocks VALUES (?, ?, ?, ?, ?, ?, ?)",
      Object.values(genesisBlock)
    );
  });
}

export { checkTable, resetDB };

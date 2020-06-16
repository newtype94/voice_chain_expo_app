import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RectButton, ScrollView } from "react-native-gesture-handler";

import * as SQLite from "expo-sqlite";
import { styles } from "../utils/styles";
const db = SQLite.openDatabase("db.db");

export default function WalletScreen() {
  const [blocks, setBlocks] = useState([]);

  function update() {
    db.transaction((tx) => {
      tx.executeSql(`select * from blocks`, [], (_, { rows: { _array } }) => {
        setBlocks(_array);
        console.log(blocks);
      });
    });
  }

  useEffect(() => {
    update();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={{ marginTop: 10, paddingBottom: 100 }}>
        {blocks.map((block, i) => (
          <View
            key={i}
            style={{
              backgroundColor: "#82bf84",
              borderColor: "#114713",
              borderWidth: 1,
              borderRadius: 5,
              marginHorizontal: 20,
              marginVertical: 5,
              padding: 8,
            }}
          >
            <Text>{JSON.stringify(block)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

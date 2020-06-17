import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableHighlight } from "react-native";
import { RectButton, ScrollView } from "react-native-gesture-handler";

import * as SQLite from "expo-sqlite";
import { styles } from "../utils/styles";
const db = SQLite.openDatabase("db.db");

export default function WalletScreen() {
  const [blocks, setBlocks] = useState([]);

  function update() {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from blocks order by idx desc`,
        [],
        (_, { rows: { _array } }) => {
          setBlocks(_array);
        }
      );
    });
  }

  useEffect(() => {
    update();
  }, []);

  return (
    <View style={styles.container}>
      <View style={{ marginTop: 15 }}>
        <TouchableHighlight
          style={{
            backgroundColor: "#d11f3a",
            borderColor: "#470912",
            borderWidth: 3,
            borderRadius: 5,
            padding: 8,
          }}
          onPress={update}
        >
          <Text style={{ color: "white", fontSize: 17 }}>새로 고침</Text>
        </TouchableHighlight>
      </View>
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
              padding: 10,
            }}
          >
            <Text>{JSON.stringify(block)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

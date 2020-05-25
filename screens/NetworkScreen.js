import React from "react";
import { StyleSheet, View, Text, TextInput, Button } from "react-native";
import axios from "axios";
import * as SQLite from "expo-sqlite";
import { url, insertQuery } from "../utils/config";
import { checkTable, resetDB } from "../utils/tableQuery";

const db = SQLite.openDatabase("db.db");

const NetworkScreen = (props) => {
  const [userId, setUserId] = React.useState("kyh");
  const [connection, setConnection] = React.useState(false);
  const [log, setLog] = React.useState("로그 기록");
  const [doClose, setDoClose] = React.useState(() => () => {});
  let wSocket;

  React.useEffect(() => {
    checkTable();
  }, []);

  const checkPlzHandler = ({
    requester,
    index,
    tx_timeStamp,
    tx_userId,
    tx_voiceHash,
  }) => {
    db.exec(
      [{ sql: "SELECT * FROM blocks idx = ?", args: [index] }],
      true,
      async (err, results) => {
        let selected = results[0].rows[0];
        const result =
          selected.tx_timeStamp === tx_timeStamp &&
          selected.tx_userId === tx_userId &&
          selected.tx_voiceHash === tx_voiceHash;
        wSocket.send(
          JSON.stringify({
            message: "check",
            data: { requester, result, checker: userId },
          })
        );
      }
    );
  };

  const addPlzHandler = (forAdd) => {
    db.exec(
      {
        sql: insertQuery,
        args: [
          forAdd.index,
          forAdd.createdAt,
          forAdd.hash,
          forAdd.previousHash,
          forAdd.tx_userId,
          forAdd.tx_voiceHash,
          forAdd.tx_timeStamp,
        ],
      },
      false,
      (err, result) => {
        if (err) console.log(err);
      }
    );

    blocks.push(forAdd);
  };

  const onMessage = (e) => {
    const got = JSON.parse(e.data);
    switch (got.message) {
      case "checkPlz":
        setLog(
          log +
            "\n[다른 유저로부터 voice hash 검증 요청]\n" +
            JSON.stringify(got.data)
        );
        checkPlzHandler(got.data);
        break;
      case "addPlz":
        setLog(
          log +
            "\n[네트워크로부터 새로운 블록이 도착]\n" +
            JSON.stringify(got.data)
        );
        addPlzHandler(got.data);
        break;
      case "checkResult":
        setLog(
          log +
            "\n[나의 voice hash 검증 요청에 대한 결과 도착]\n" +
            JSON.stringify(got.data)
        );
        break;
      case "addFailed":
        setLog(log + "\n[블록 전송 실패]");
        break;
      default:
        break;
    }
  };

  const doOpen = async () => {
    setLog(log + "\n블록 체크를 시작합니다.");
    db.exec(
      [{ sql: "SELECT * FROM blocks ORDER BY idx DESC LIMIT 1", args: [] }],
      true,
      async (err, results) => {
        let lastBlock = results[0].rows[0];
        console.log(lastBlock);
        let query =
          url.rest +
          `/check?index=${lastBlock.idx}` +
          `&hash=${lastBlock.hash}` +
          `&previousHash=${lastBlock.previousHash}` +
          `&createdAt=${lastBlock.createdAt}` +
          `&tx_userId=${lastBlock.tx_userId}` +
          `&tx_voiceHash=${lastBlock.tx_voiceHash}` +
          `&tx_timeStamp=${lastBlock.tx_timeStamp}`;
        console.log(query);
        const got = await axios.get(query, { crossdomain: true });
        const { isCorrect, isLast } = got.data;

        if (!isCorrect) {
          setLog(log + "\n블록에 오류가 있어 전면 교체합니다.");
          resetDB();
        } else if (!isLast) {
          const forUpdate = await axios.get(
            "https://jylagc9o0j.execute-api.ap-northeast-2.amazonaws.com/prod/block?start=" +
              (lastBlock.idx + 1),
            { crossdomain: true }
          );
          let sqls = forUpdate.data.Items.map((item) => ({
            sql: insertQuery,
            args: [
              item.index,
              item.createdAt,
              item.hash,
              item.previousHash,
              item.tx_userId,
              item.tx_voiceHash,
              item.tx_timeStamp,
            ],
          }));
          db.exec(sqls, false, (err, result) => {
            if (err) console.log(err);
          });
          setLog(
            log + "\n블록을 최신으로 업데이트 했습니다. 다시 connect 해주세요"
          );
        } else {
          setLog(log + "\n블록이 최신 버전입니다.");
          wSocket = new WebSocket(url.socket);
          wSocket.onopen = () => {
            setConnection(true);
          };
          wSocket.onclose = () => {
            setConnection(false);
          };
          wSocket.onerror = (e) => {
            setLog(log + "\nError : " + e.data);
          };
          wSocket.onmessage = onMessage;
          setDoClose(() => () => {
            wSocket.close();
          });
        }
      }
    );
  };

  return (
    <View>
      <Text>블록체인 네트워크 {connection ? "연결됨" : "연결 끊김"}</Text>
      <Text style={styles.heading}>Insert your userId</Text>
      <View style={styles.flexRow}>
        <TextInput
          onChangeText={(text) => setUserId({ text })}
          placeholder="Insert your userId"
          style={styles.input}
          value={userId}
          doClose={doClose}
          log={log}
        />
      </View>
      {connection ? (
        <Button onPress={doClose} title="Disconnect" color="#f54927" />
      ) : (
        <Button onPress={doOpen} title="connect" color="#42f55a" />
      )}
      <Text>{log}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  flexRow: {
    flexDirection: "row",
  },
  input: {
    borderColor: "#4630eb",
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    height: 48,
    margin: 16,
    padding: 8,
  },
});

export default NetworkScreen;

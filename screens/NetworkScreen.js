import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Dimensions,
  Button,
  ToastAndroid,
  TouchableHighlight,
  ScrollView,
  Share,
  AsyncStorage,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Permissions from "expo-permissions";
import * as SQLite from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

import axios from "axios";

import { url, insertQuery } from "../utils/config";
import { styles } from "../utils/styles";
import { getMMSSFromMillis } from "../utils/getMMSSFromMillis";
import { checkTable, resetDB } from "../utils/tableQuery";
import calculateHash from "../utils/caculateHash";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");
const db = SQLite.openDatabase("db.db");

let wSocket = null;
let recording = null;
let logs = "";

const NetworkScreen = (props) => {
  //About Socket
  const [userId, setUserId] = useState("kyh");
  const [connection, setConnection] = useState(false);
  const [doClose, setDoClose] = useState(() => () => {});
  const [doSend, setDoSend] = useState(() => () => {});

  //About Recording
  const [permitted, setPermitted] = useState(false);
  const [fileName, setFileName] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [stage, setStage] = useState("");

  const [log, setLog] = useState("\n");

  useEffect(() => {
    checkTable();
    askForPermissions();
    updateStage();
  }, []);

  async function updateStage() {
    const gotName = await AsyncStorage.getItem("fileName");
    setStage(gotName);
  }

  async function askForPermissions() {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    setPermitted(response.status === "granted");
  }

  function addPlzHandler(forAdd) {
    db.exec(
      [
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
      ],
      false,
      (err, result) => {
        if (err) console.log(err);
      }
    );
  }

  function onMessage(e) {
    const got = JSON.parse(e.data);
    switch (got.message) {
      case "checkPlz":
        console.log("checkplz");
        setLog(
          log +
            "\n[다른 유저로부터 voice hash 검증 요청]\n" +
            JSON.stringify(got.data)
        );
        checkPlzHandler(got.data);
        break;
      case "addPlz":
        console.log("addplz");
        setLog(
          log +
            "\n[네트워크로부터 새로운 블록이 도착]\n" +
            JSON.stringify(got.data)
        );
        addPlzHandler(got.data);
        break;
      case "checkResult":
        console.log("checkResult");
        setLog(
          log +
            "\n[나의 voice hash 검증 요청에 대한 결과 도착]\n" +
            JSON.stringify(got.data)
        );
        break;
      case "addFailed":
        console.log("addFailed");
        setLog(log + "\n[블록 전송 실패]\n" + JSON.stringify(got.data));
        break;
    }
  }

  function checkPlzHandler({
    requester,
    index,
    tx_timeStamp,
    tx_userId,
    tx_voiceHash,
  }) {
    db.exec(
      [{ sql: "SELECT * FROM blocks WHERE idx = ?", args: [index] }],
      true,
      (err, results) => {
        let selected = results[0].rows[0];
        const result =
          selected.tx_timeStamp === tx_timeStamp &&
          selected.tx_userId === tx_userId &&
          selected.tx_voiceHash === tx_voiceHash;
        doSend(
          JSON.stringify({
            message: "check",
            data: { requester, result, checker: userId },
          })
        );
      }
    );
  }

  function checkRequest() {
    let temp = stage.slice(0, stage.length - 4);
    const [notUse, tx_userId, tx_timeStamp] = temp.split("___");
    db.exec(
      [
        {
          sql: "SELECT * FROM blocks WHERE tx_userId = ? AND tx_timeStamp = ?",
          args: [tx_userId, parseInt(tx_timeStamp)],
        },
      ],
      true,
      async (err, result) => {
        const hashGotFromFile = await AsyncStorage.getItem("fileHash");
        doSend(
          JSON.stringify({
            message: "check",
            data: {
              index: result[0].rows[0].idx,
              tx_voiceHash: hashGotFromFile,
              tx_userId,
              tx_timeStamp: parseInt(tx_timeStamp),
            },
          })
        );
      }
    );
  }

  async function doOpen() {
    ToastAndroid.show("블록 체크를 시작합니다", ToastAndroid.SHORT);
    db.exec(
      [{ sql: "SELECT * FROM blocks ORDER BY idx DESC LIMIT 1", args: [] }],
      true,
      async (err, results) => {
        let lastBlock = results[0].rows[0];
        let query =
          url.rest +
          `/check?index=${lastBlock.idx}` +
          `&hash=${lastBlock.hash}` +
          `&previousHash=${lastBlock.previousHash}` +
          `&createdAt=${lastBlock.createdAt}` +
          `&tx_userId=${lastBlock.tx_userId}` +
          `&tx_voiceHash=${lastBlock.tx_voiceHash}` +
          `&tx_timeStamp=${lastBlock.tx_timeStamp}`;
        const got = await axios.get(query, { crossdomain: true });
        const { isCorrect, isLast } = got.data;

        if (!isCorrect) {
          ToastAndroid.show(
            "블록에 오류가 있어 전면 교체합니다.",
            ToastAndroid.SHORT
          );
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
          ToastAndroid.show(
            "블록을 최신으로 업데이트 했습니다. 다시 connect 해주세요.",
            ToastAndroid.SHORT
          );
        } else {
          ToastAndroid.show("블록이 최신 버전입니다.", ToastAndroid.SHORT);
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
          setDoSend(() => (input) => {
            wSocket.send(input);
          });
        }
      }
    );
  }

  function updateScreenForRecordingStatus(status) {
    if (status.canRecord) {
      setIsRecording(status.isRecording);
      setRecordingDuration(status.durationMillis);
    } else if (status.isDoneRecording) {
      setIsRecording(false);
      setRecordingDuration(status.durationMillis);
    }
  }

  async function startRecording() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
    if (recording !== null) {
      recording.setOnRecordingStatusUpdate(null);
      recording = null;
    }

    const newRecording = new Audio.Recording();
    await newRecording.prepareToRecordAsync({
      ios: Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY.ios,
      android: {
        extension: ".mp3",
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_AMR_WB,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AMR_WB,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
      },
    });
    newRecording.setOnRecordingStatusUpdate(updateScreenForRecordingStatus);
    recording = newRecording;
    await recording.startAsync();
  }

  async function finishRecording() {
    try {
      await recording.stopAndUnloadAsync();
    } catch (error) {}

    const info = await FileSystem.getInfoAsync(recording.getURI(), {
      md5: true,
    });
    const now = new Date().getTime();
    const newName =
      (fileName || "recorded") + "___" + userId + "___" + now + ".mp3";

    db.exec(
      [{ sql: "SELECT * FROM blocks order by idx DESC limit 1", args: [] }],
      true,
      async (err, result) => {
        // send to socket to broadcast my voice
        const newBlock = {
          index: result[0].rows[0].idx + 1,
          hash: "",
          previousHash: result[0].rows[0].hash,
          createdAt: new Date().getTime(),
          tx_userId: userId,
          tx_voiceHash: info.md5,
          tx_timeStamp: now,
        };
        newBlock.hash = await calculateHash(newBlock);
        doSend(
          JSON.stringify({
            message: "add",
            data: newBlock,
          })
        );
      }
    );

    await FileSystem.moveAsync({
      from: info.uri,
      to: FileSystem.documentDirectory + newName,
    });
    db.exec(
      [
        {
          sql: "INSERT INTO records (name) VALUES (?)",
          args: [newName],
        },
      ],
      false,
      (err, results) => {
        err ? console.log(err) : console.log(results);
      }
    );

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
  }

  async function onFindPressed() {
    const get = await DocumentPicker.getDocumentAsync();
    console.log(get);
  }

  function _getRecordingTimestamp() {
    if (recordingDuration !== null)
      return `${getMMSSFromMillis(recordingDuration)}`;
    return `${getMMSSFromMillis(0)}`;
  }

  return !permitted ? (
    <View style={styles.container}>
      <Text style={{ textAlign: "center" }}>
        You must enable audio recording permissions in order to use this app.
      </Text>
    </View>
  ) : !connection ? (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        아이디를 입력해주세요
      </Text>
      <TextInput
        onChangeText={(text) => setUserId(text)}
        placeholder="user Id"
        style={styles.input}
        value={userId}
        doClose={doClose}
        log={log}
      />
      <TouchableHighlight onPress={doOpen}>
        <Ionicons
          name="ios-arrow-dropright-circle"
          size={50}
          color="darkblue"
        />
      </TouchableHighlight>
    </View>
  ) : (
    <View style={styles.container}>
      <View style={styles.networkRow}>
        <TouchableHighlight
          style={{
            backgroundColor: "#d11f3a",
            borderColor: "#470912",
            borderWidth: 3,
            borderRadius: 5,
            padding: 8,
          }}
          onPress={doClose}
        >
          <Text style={{ color: "white", fontSize: 17 }}>연결 해제</Text>
        </TouchableHighlight>
        <TouchableHighlight
          style={{
            backgroundColor: "#9ad7e3",
            borderColor: "#1c515c",
            borderWidth: 3,
            borderRadius: 5,
            padding: 8,
          }}
          onPress={checkRequest}
        >
          <Text style={{ fontSize: 17 }}>stage 음원 검증</Text>
        </TouchableHighlight>
        <TouchableHighlight onPress={updateStage}>
          <Ionicons name="ios-refresh-circle" size={30} color="darkblue" />
        </TouchableHighlight>
      </View>
      <View style={styles.networkRow}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          On Stage
        </Text>
        <Text>{stage.length > 0 ? stage : "비어 있음"}</Text>
      </View>
      <View style={styles.networkRow}>
        <TouchableHighlight underlayColor="skyblue" onPress={onFindPressed}>
          <Ionicons
            name="ios-search"
            size={80}
            style={[{ opacity: isRecording ? 0.0 : 1.0 }]}
            color="black"
          />
        </TouchableHighlight>
        <TouchableHighlight
          underlayColor="skyblue"
          onPress={isRecording ? finishRecording : startRecording}
        >
          <Ionicons
            name="ios-mic"
            size={80}
            color={isRecording ? "red" : "black"}
          />
        </TouchableHighlight>
        <TextInput
          onChangeText={(text) => setFileName(text)}
          placeholder="file name"
          style={[styles.input, { opacity: isRecording ? 0.0 : 1.0 }]}
          value={fileName}
          doClose={doClose}
          log={log}
        />
        <View>
          <Text style={{ color: "red" }}>{isRecording ? "LIVE" : ""}</Text>
          <Ionicons
            name="ios-pulse"
            size={30}
            style={[{ opacity: isRecording ? 1.0 : 0.0 }]}
            color="black"
          />
          <Text>{_getRecordingTimestamp()}</Text>
        </View>
      </View>
      <ScrollView
        style={{
          flex: 1,
          minHeight: DEVICE_HEIGHT * 0.5,
          maxHeight: DEVICE_HEIGHT * 0.5,
          alignSelf: "stretch",
          margin: 20,
          borderWidth: 2,
          borderRadius: 5,
          borderColor: "grey",
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontSize: 15,
            fontWeight: "bold",
            paddingVertical: 10,
          }}
        >
          네트워크 기록
        </Text>
        <Text>{log}</Text>
      </ScrollView>
    </View>
  );
};

export default NetworkScreen;

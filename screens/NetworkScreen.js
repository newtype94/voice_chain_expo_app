import React from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ToastAndroid,
  TouchableHighlight,
  ScrollView,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Permissions from "expo-permissions";
import * as SQLite from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";

import axios from "axios";

import { url, insertQuery } from "../utils/config";
import { styles } from "../utils/styles";
import { getMMSSFromMillis } from "../utils/getMMSSFromMillis";
import { checkTable, resetDB } from "../utils/tableQuery";

const db = SQLite.openDatabase("db.db");

let wSocket = null;
let recording = null;

const NetworkScreen = (props) => {
  //About Socket
  const [userId, setUserId] = React.useState("kyh");
  const [connection, setConnection] = React.useState(false);
  const [doClose, setDoClose] = React.useState(() => () => {});

  //About Recording
  const [permitted, setPermitted] = React.useState(false);
  const [recordingDuration, setRecordingDuration] = React.useState(null);
  const [isRecording, setIsRecording] = React.useState(false);

  const [log, setLog] = React.useState("\n");

  React.useEffect(() => {
    checkTable();
    askForPermissions();
  }, []);

  async function askForPermissions() {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    setPermitted(response.status === "granted");
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
        wSocket.send(
          JSON.stringify({
            message: "check",
            data: { requester, result, checker: userId },
          })
        );
      }
    );
  }

  function addPlzHandler(forAdd) {
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
  }

  function onMessage(e) {
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
  }

  async function doOpen() {
    ToastAndroid.show("블록 체크를 시작합니다", ToastAndroid.SHORT);
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
    console.log(`FILE INFO: ${JSON.stringify(info)}`);

    const newLink = FileSystem.documentDirectory + info.md5 + ".mp3";

    const infos = await FileSystem.moveAsync({
      from: recording.getURI(),
      to: newLink,
    });
    console.log(`FILE INFO: ${JSON.stringify(infos)}`);

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

  function onRecordPressed() {
    if (isRecording) finishRecording();
    else startRecording();
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
        placeholder="Insert your userId"
        style={styles.input}
        value={userId}
        doClose={doClose}
        log={log}
      />
      <Button onPress={doOpen} title="네트워크 연결" color="green" />
    </View>
  ) : (
    <View style={styles.container}>
      <Button onPress={doClose} title="네트워크 연결 해제" color="#f54927" />
      <View style={styles.recordContainer}>
        <TouchableHighlight underlayColor="skyblue">
          <Ionicons
            name="ios-search"
            size={100}
            style={[{ opacity: isRecording ? 0.0 : 1.0 }]}
            color="black"
          />
        </TouchableHighlight>
        <TouchableHighlight underlayColor="skyblue" onPress={onRecordPressed}>
          <Ionicons
            name="ios-mic"
            size={100}
            color={isRecording ? "red" : "black"}
          />
        </TouchableHighlight>
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
      <ScrollView style={{ flex: 1 }}>
        <Text style={{ fontSize: 15 }}>네트워크 기록</Text>
        <Text>{log}</Text>
      </ScrollView>
    </View>
  );
};

export default NetworkScreen;

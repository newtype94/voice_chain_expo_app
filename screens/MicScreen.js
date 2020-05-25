import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Permissions from "expo-permissions";

import * as SQLite from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
const db = SQLite.openDatabase("db.db");

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");
const BACKGROUND_COLOR = "#d8e8e5";
const LIVE_COLOR = "#FF0000";

export default class MicScreen extends React.Component {
  constructor(props) {
    super(props);
    this.recording = null;
    this.state = {
      haveRecordingPermissions: false,
      recordingDuration: null,
      isRecording: false,
    };
  }

  componentDidMount() {
    this._askForPermissions();
  }

  _askForPermissions = async () => {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    this.setState({
      haveRecordingPermissions: response.status === "granted",
    });
  };

  _updateScreenForRecordingStatus = (status) => {
    if (status.canRecord) {
      this.setState({
        isRecording: status.isRecording,
        recordingDuration: status.durationMillis,
      });
    } else if (status.isDoneRecording) {
      this.setState({
        isRecording: false,
        recordingDuration: status.durationMillis,
      });
    }
  };

  async _startRecording() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
    if (this.recording !== null) {
      this.recording.setOnRecordingStatusUpdate(null);
      this.recording = null;
    }

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
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
    recording.setOnRecordingStatusUpdate(this._updateScreenForRecordingStatus);

    this.recording = recording;
    await this.recording.startAsync();
  }

  async _finishRecording() {
    try {
      await this.recording.stopAndUnloadAsync();
    } catch (error) {}

    const info = await FileSystem.getInfoAsync(this.recording.getURI(), {
      md5: true,
    });
    console.log(`FILE INFO: ${JSON.stringify(info)}`);

    const newLink = FileSystem.documentDirectory + info.md5 + ".mp3";

    const infos = await FileSystem.moveAsync({
      from: this.recording.getURI(),
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

  _onRecordPressed = () => {
    if (this.state.isRecording) {
      this._finishRecording();
    } else {
      this._startRecording();
    }
  };

  _getMMSSFromMillis(millis) {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);

    const padWithZero = (number) => {
      const string = number.toString();
      if (number < 10) {
        return "0" + string;
      }
      return string;
    };
    return padWithZero(minutes) + ":" + padWithZero(seconds);
  }

  _getRecordingTimestamp() {
    if (this.state.recordingDuration != null) {
      return `${this._getMMSSFromMillis(this.state.recordingDuration)}`;
    }
    return `${this._getMMSSFromMillis(0)}`;
  }

  render() {
    if (!this.state.haveRecordingPermissions) {
      return (
        <View style={styles.container}>
          <View />
          <Text style={[styles.noPermissionsText]}>
            You must enable audio recording permissions in order to use this
            app.
          </Text>
          <View />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={[styles.halfScreenContainer]}>
          <View />
          <View style={styles.recordingContainer}>
            <View />
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={this._onRecordPressed}
            >
              <Ionicons
                name="ios-mic"
                size={100}
                color={this.state.isRecording ? LIVE_COLOR : "#383f4a"}
              />
            </TouchableHighlight>
            <View style={styles.recordingDataContainer}>
              <View />
              <Text style={[styles.liveText]}>
                {this.state.isRecording ? "LIVE" : ""}
              </Text>
              <View style={styles.recordingDataRowContainer}>
                <Ionicons
                  name="ios-pulse"
                  size={30}
                  style={[{ opacity: this.state.isRecording ? 1.0 : 0.0 }]}
                  color="#383f4a"
                />
                <Text style={[styles.recordingTimestamp]}>
                  {this._getRecordingTimestamp()}
                </Text>
              </View>
              <View />
            </View>
            <View />
          </View>
          <View />
        </View>
        <View style={[styles.halfScreenContainer]}>
          <Text>TO UPLOAD VOICE HASH</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: BACKGROUND_COLOR,
    minHeight: DEVICE_HEIGHT,
    maxHeight: DEVICE_HEIGHT,
  },
  noPermissionsText: {
    textAlign: "center",
  },
  wrapper: {},
  halfScreenContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    minHeight: DEVICE_HEIGHT / 2.0,
    maxHeight: DEVICE_HEIGHT / 2.0,
  },
  recordingContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    minHeight: 120,
    maxHeight: 120,
  },
  recordingDataContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 100,
    maxHeight: 100,
    minWidth: 70 * 3.0,
    maxWidth: 70 * 3.0,
  },
  recordingDataRowContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 10,
    maxHeight: 10,
  },
  liveText: {
    color: LIVE_COLOR,
  },
  recordingTimestamp: {
    paddingLeft: 20,
  },
});

import React from "react";
import {
  Dimensions,
  Slider,
  Text,
  TouchableHighlight,
  View,
  ScrollView,
  Share,
} from "react-native";
import { Audio } from "expo-av";
import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../utils/styles";

const db = SQLite.openDatabase("db.db");

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");
const BACKGROUND_COLOR = "#FFF8ED";
const LOADING_STRING = "... loading ...";
const BUFFERING_STRING = "...buffering...";

export default class RecordScreen extends React.Component {
  constructor(props) {
    super(props);
    this.index = 0;
    this.isSeeking = false;
    this.shouldPlayAtEndOfSeek = false;
    this.playbackInstance = null;
    this.state = {
      playbackInstanceName: LOADING_STRING,
      muted: false,
      playbackInstancePosition: null,
      playbackInstanceDuration: null,
      shouldPlay: false,
      isPlaying: false,
      isBuffering: false,
      isLoading: true,
      volume: 1.0,
      playList: [],
    };
  }

  componentDidMount() {
    this.update();
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
    });
  }

  update() {
    db.transaction((tx) => {
      tx.executeSql(`select * from records`, [], (_, { rows: { _array } }) => {
        this.setState({ playList: _array });
        this._loadNewPlaybackInstance(false);
      });
    });
  }

  async _loadNewPlaybackInstance(playing) {
    if (this.playbackInstance != null) {
      await this.playbackInstance.unloadAsync();
      this.playbackInstance = null;
    }
    const source = {
      uri: FileSystem.documentDirectory + this.state.playList[this.index].name,
    };
    const initialStatus = {
      shouldPlay: playing,
      volume: this.state.volume,
      isMuted: this.state.muted,
    };

    const { sound, status } = await Audio.Sound.createAsync(
      source,
      initialStatus,
      this._onPlaybackStatusUpdate
    );
    this.playbackInstance = sound;
    this._updateScreenForLoading(false);
  }

  _updateScreenForLoading(isLoading) {
    if (isLoading) {
      this.setState({
        isPlaying: false,
        playbackInstanceName: LOADING_STRING,
        playbackInstanceDuration: null,
        playbackInstancePosition: null,
        isLoading: true,
      });
    } else {
      this.setState({
        playbackInstanceName: this.state.playList[this.index].name,
        isLoading: false,
      });
    }
  }

  _onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      this.setState({
        playbackInstancePosition: status.positionMillis,
        playbackInstanceDuration: status.durationMillis,
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,
        isBuffering: status.isBuffering,
        muted: status.isMuted,
        volume: status.volume,
      });
      if (status.didJustFinish) {
        this.index = (this.index + 1) % this.state.playList.length;
        this._updatePlaybackInstanceForIndex(true);
      }
    } else {
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  async _updatePlaybackInstanceForIndex(playing) {
    this._updateScreenForLoading(true);
    this._loadNewPlaybackInstance(playing);
  }

  _onSeekSliderValueChange = (value) => {
    if (this.playbackInstance != null && !this.isSeeking) {
      this.isSeeking = true;
      this.shouldPlayAtEndOfSeek = this.state.shouldPlay;
      this.playbackInstance.pauseAsync();
    }
  };

  _onSeekSliderSlidingComplete = async (value) => {
    if (this.playbackInstance != null) {
      this.isSeeking = false;
      const seekPosition = value * this.state.playbackInstanceDuration;
      if (this.shouldPlayAtEndOfSeek) {
        this.playbackInstance.playFromPositionAsync(seekPosition);
      } else {
        this.playbackInstance.setPositionAsync(seekPosition);
      }
    }
  };

  _getSeekSliderPosition() {
    if (
      this.playbackInstance != null &&
      this.state.playbackInstancePosition != null &&
      this.state.playbackInstanceDuration != null
    ) {
      return (
        this.state.playbackInstancePosition /
        this.state.playbackInstanceDuration
      );
    }
    return 0;
  }

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

  _getTimestamp() {
    if (
      this.playbackInstance != null &&
      this.state.playbackInstancePosition != null &&
      this.state.playbackInstanceDuration != null
    ) {
      return `${this._getMMSSFromMillis(
        this.state.playbackInstancePosition
      )} / ${this._getMMSSFromMillis(this.state.playbackInstanceDuration)}`;
    }
    return "";
  }

  render() {
    return (
      <View style={styles.container}>
        <View
          style={{
            flex: 1,
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            alignSelf: "stretch",
            minHeight: DEVICE_HEIGHT / 4,
            maxHeight: DEVICE_HEIGHT / 4,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
              alignSelf: "stretch",
            }}
          >
            <Text>{this.state.playbackInstanceName}</Text>
          </View>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
              alignSelf: "stretch",
            }}
          >
            <Slider
              style={{ width: DEVICE_WIDTH * 0.8 }}
              value={this._getSeekSliderPosition()}
              onValueChange={this._onSeekSliderValueChange}
              onSlidingComplete={this._onSeekSliderSlidingComplete}
              disabled={this.state.isLoading}
            />
          </View>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
              alignSelf: "stretch",
            }}
          >
            <Text
              style={{
                textAlign: "left",
                paddingLeft: 20,
              }}
            >
              {this.state.isBuffering ? BUFFERING_STRING : ""}
            </Text>
            <Text
              style={{
                textAlign: "right",
                paddingRight: 20,
              }}
            >
              {this._getTimestamp()}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-around",
              alignSelf: "stretch",
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TouchableHighlight
                underlayColor={BACKGROUND_COLOR}
                onPress={() => {
                  if (this.playbackInstance != null)
                    this.playbackInstance.setIsMutedAsync(!this.state.muted);
                }}
              >
                {this.state.muted ? (
                  <Ionicons name="ios-volume-off" size={50} color="black" />
                ) : (
                  <Ionicons name="ios-volume-low" size={50} color="black" />
                )}
              </TouchableHighlight>
              <Slider
                value={1}
                style={{ width: DEVICE_WIDTH * 0.3 }}
                onValueChange={(value) => {
                  if (this.playbackInstance != null)
                    this.playbackInstance.setVolumeAsync(value);
                }}
              />
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-around",
              }}
            >
              <TouchableHighlight
                underlayColor={BACKGROUND_COLOR}
                onPress={() => {
                  if (this.playbackInstance != null) {
                    this.state.isPlaying
                      ? this.playbackInstance.pauseAsync()
                      : this.playbackInstance.playAsync();
                  }
                }}
                disabled={this.state.isLoading}
              >
                <Ionicons
                  name={this.state.isPlaying ? "ios-pause" : "ios-play"}
                  size={50}
                  color="black"
                />
              </TouchableHighlight>
              <TouchableHighlight
                underlayColor={BACKGROUND_COLOR}
                onPress={() => {
                  if (this.playbackInstance != null) {
                    this.playbackInstance.stopAsync();
                  }
                }}
                disabled={this.state.isLoading}
              >
                <Ionicons name="ios-square" size={50} color="black" />
              </TouchableHighlight>
            </View>
          </View>
        </View>
        <ScrollView>
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: "brown",
              marginVertical: 20,
            }}
          />
          {this.state.playList.map(({ idx, name }, i) => (
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginVertical: 3,
              }}
              key={idx}
            >
              <TouchableHighlight
                style={{
                  backgroundColor: "#edd940",
                  borderColor: "brown",
                  borderWidth: 1,
                  padding: 8,
                }}
                onPress={() => {
                  if (this.playbackInstance != null) {
                    this.index = i;
                    this._updatePlaybackInstanceForIndex(this.state.shouldPlay);
                  }
                }}
              >
                <Text style={{ color: "black" }}>{name}</Text>
              </TouchableHighlight>
              <TouchableHighlight style={{ marginHorizontal: 20 }}>
                <Ionicons name="ios-share" size={40} color="black" />
              </TouchableHighlight>
              <TouchableHighlight>
                <Ionicons name="ios-trash" size={40} color="black" />
              </TouchableHighlight>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }
}

import React, { Component } from "react";
import { Text, Dimensions, ScrollView, ImagePropTypes } from "react-native";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");

export default class Greeting extends Component {
  render() {
    return (
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
        {this.props.logs.map((v, i) => (
          <Text key={i} style={{ padding: 10 }}>
            {v}
          </Text>
        ))}
      </ScrollView>
    );
  }
}

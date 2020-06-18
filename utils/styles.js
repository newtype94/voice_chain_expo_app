import { StyleSheet, Dimensions } from "react-native";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#EEEEEE",
    minHeight: DEVICE_HEIGHT,
    maxHeight: DEVICE_HEIGHT,
    paddingBottom: 130,
  },
  networkRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    alignSelf: "stretch",
  },
  input: {
    borderColor: "black",
    borderRadius: 4,
    borderWidth: 1,
    height: 48,
    width: 150,
    padding: 8,
  },
});

export { styles };

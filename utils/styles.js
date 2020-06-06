import { StyleSheet, Dimensions } from "react-native";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "steelblue",
    minHeight: DEVICE_HEIGHT,
    maxHeight: DEVICE_HEIGHT,
  },
  halfScreenContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    minHeight: DEVICE_HEIGHT / 2.0,
    maxHeight: DEVICE_HEIGHT / 2.0,
  },
  recordContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    alignSelf: "stretch",
    minHeight: 100,
    maxHeight: 100,
  },
  input: {
    borderColor: "steelblue",
    borderRadius: 4,
    borderWidth: 1,
    height: 48,
    margin: 16,
    padding: 8,
  },
});

export { styles };

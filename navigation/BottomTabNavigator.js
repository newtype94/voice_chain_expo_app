import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as React from "react";

import TabBarIcon from "../components/TabBarIcon";
import NetworkScreen from "./../screens/NetworkScreen";
import RecordScreen from "./../screens/RecordScreen";
import WalletScreen from "../screens/WalletScreen";

const BottomTab = createBottomTabNavigator();
const INITIAL_ROUTE_NAME = "Home";

export default function BottomTabNavigator({ navigation, route }) {
  navigation.setOptions({ headerTitle: getHeaderTitle(route) });

  return (
    <BottomTab.Navigator initialRouteName={INITIAL_ROUTE_NAME}>
      <BottomTab.Screen
        name="Network"
        component={NetworkScreen}
        options={{
          title: "Network",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name="md-planet" />
          ),
        }}
      />
      <BottomTab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          title: "Wallet",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name="md-book" />
          ),
        }}
      />
      <BottomTab.Screen
        name="Record"
        component={RecordScreen}
        options={{
          title: "Record",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name="md-mic" />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}

function getHeaderTitle(route) {
  const routeName =
    route.state?.routes[route.state.index]?.name ?? INITIAL_ROUTE_NAME;

  switch (routeName) {
    case "Network":
      return "블록체인 접속";
    case "Wallet":
      return "내 지갑";
    case "Record":
      return "저장된 녹음 파일";
  }
}

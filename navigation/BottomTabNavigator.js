import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as React from "react";

import TabBarIcon from "../components/TabBarIcon";
import HomeScreen from "../screens/HomeScreen";
import LinksScreen from "../screens/LinksScreen";
import MicScreen from "../screens/MicScreen";
import NetworkScreen from "./../screens/NetworkScreen";

const BottomTab = createBottomTabNavigator();
const INITIAL_ROUTE_NAME = "Home";

export default function BottomTabNavigator({ navigation, route }) {
  navigation.setOptions({ headerTitle: getHeaderTitle(route) });

  return (
    <BottomTab.Navigator initialRouteName={INITIAL_ROUTE_NAME}>
      <BottomTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Get Started",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name="md-code-working" />
          ),
        }}
      />
      <BottomTab.Screen
        name="Links"
        component={LinksScreen}
        options={{
          title: "Resources",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name="md-book" />
          ),
        }}
      />
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
        name="Mic"
        component={MicScreen}
        options={{
          title: "Mic",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name="ios-microphone" />
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
    case "Home":
      return "How to get started";
    case "Links":
      return "Links to learn more";
    case "Network":
      return "블록체인 활동";
    case "Mic":
      return "음성 녹음";
  }
}

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as React from "react";

import TabBarIcon from "../components/TabBarIcon";
import InfoScreen from "../screens/InfoScreen";
import NetworkScreen from "./../screens/NetworkScreen";

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
        name="Info"
        component={InfoScreen}
        options={{
          title: "Info",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name="md-book" />
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
    case "Info":
      return "내 정보";
    case "Network":
      return "블록체인 활동";
  }
}

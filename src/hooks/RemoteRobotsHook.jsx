import {useContext} from "react";
import {RemoteRobotsContext} from "../providers/RemoteRobotsContext.jsx";

export default function useRemoteRobots(context = RemoteRobotsContext) {
    return useContext(context);
}
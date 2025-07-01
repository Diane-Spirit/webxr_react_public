import {useContext} from "react";
import {SceneContext} from "../providers/SceneContext.jsx";

export default function useScene(context = SceneContext) {
    return useContext(context);
}
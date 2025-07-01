import {createContext, useState} from "react";
export const SceneContext = createContext();

export function SceneContextProvider({children}) {

    // State to hold the current scene
    const [scene, setScene] = useState(null);

    // State to hold the current route for ui
    const [route, setRoute] = useState(null);

    return (
        <SceneContext.Provider value={{
            scene,
            setScene,
            route,
            setRoute
        }}>
            {children}
        </SceneContext.Provider>
    );
}
import { createContext, useEffect, useRef, useState } from "react";
import { workerScript, Encoding } from "../workers/WebSocketWorker.js";
import useLatencyTest from "../hooks/useLatencyTest.jsx";

export const RemoteRobotsContext = createContext({});

const isWebsocketOk = (obj) => {
    return obj && obj.readyState === WebSocket.OPEN;
};

export default function RemoteRobotsContextProvider({ children, signalingURL, reconnectInterval = 5000 }) {
    const [robots, setRobots] = useState([]);
    const [selectedRobot, setSelectedRobot] = useState(null);
    const [switchingRobot, setSwitchingRobot] = useState(false);
    const [controlSocketState, setControlSocketState] = useState('Initializing');
    const [telemetrySocketState, setTelemetrySocketState] = useState('Initializing');
    const [streamingSocketState, setStreamingSocketState] = useState('Initializing'); // For the worker-managed WebSocket
    const pointCloudRef = useRef(null);
    const sessionStartDateRef = useRef(null); // Ref to store the session start date

    const controlSocketRef = useRef(null);
    const telemetrySocketRef = useRef(null);
    const workerRef = useRef(null);
    const pointCloudSubscribersRef = useRef([]);

    const robotsRef = useRef(robots);

    useEffect(() => {
        robotsRef.current = robots;
    }, [robots]);

    useEffect(() => {
        const initControlSocket = () => {
            setControlSocketState('Connecting');
            const controlWS = new WebSocket("ws://localhost:8085");

            controlWS.onopen = () => {
                console.log('Control WebSocket connected');
                setControlSocketState('Connected');
                controlWS.send(JSON.stringify({ type: 'initBridge', url: signalingURL }));
            };
            controlWS.onclose = () => {
                console.log('Control WebSocket disconnected, attempting to reconnect...');
                setControlSocketState('Disconnected');
                controlSocketRef.current = null;
                setTimeout(initControlSocket, reconnectInterval);
            };
            controlWS.onerror = (error) => {
                console.error('Control WebSocket error:', error);
                setControlSocketState('Error');
                // onclose will likely follow
            };

            controlWS.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.type === 'switchedRobot') {
                    const currentRobots = robotsRef.current;
                    const robot = currentRobots.find(r => r.id == data.robotId);
                    console.log(JSON.stringify(currentRobots));
                    if (robot) {
                        setSelectedRobot(robot);
                        // Set session start date for latency test
                        sessionStartDateRef.current = new Date();
                    } else {
                        console.error(`Robot ${data.robotId} not found`);
                        setSelectedRobot(null);
                    }
                    setSwitchingRobot(false);
                } else if (data.type === 'updateRobots') {
                    setRobots(data.robots);
                }
            };

            controlSocketRef.current = controlWS;
        };

        const initTelemetrySocket = () => {
            setTelemetrySocketState('Connecting');
            const telemetryWS = new WebSocket("ws://localhost:8090");

            telemetryWS.onopen = () => {
                console.log('Telemetry WebSocket connected');
                setTelemetrySocketState('Connected');
            };
            telemetryWS.onclose = () => {
                console.log('Telemetry WebSocket disconnected, attempting to reconnect...');
                setTelemetrySocketState('Disconnected');
                telemetrySocketRef.current = null;
                setTimeout(initTelemetrySocket, reconnectInterval);
            };
            telemetryWS.onerror = (error) => {
                console.error('Telemetry WebSocket error:', error);
                setTelemetrySocketState('Error');
            };

            telemetrySocketRef.current = telemetryWS;
        };

        const initStreamingSocket = () => {
            setStreamingSocketState('Connecting'); // Set state before worker init and message
            const wsWorker = new Worker(workerScript);

            wsWorker.onmessage = (event) => {
                const { type, payload } = event.data;
                if (type === 'updatePoints') {
                    if (pointCloudRef.current) {
                        pointCloudRef.current.loadFromPoints(payload.positions, payload.colors);
                    }
                    // Notify subscribers
                    pointCloudSubscribersRef.current.forEach(sub => sub(payload));

                } else if (type === 'connectionState') {
                    setStreamingSocketState(payload); // Worker sends 'Connecting', 'Open', 'Closed', 'Error'

                    if (payload === 'Closed') {
                        setTimeout(initStreamingSocket, reconnectInterval);
                    }
                }
            };

            wsWorker.postMessage({ type: 'init', url: "ws://localhost:8095", encoding: Encoding.XYZ_RGB16_i16 });
            workerRef.current = wsWorker;
        };

        initControlSocket();
        initTelemetrySocket();
        initStreamingSocket();

        return () => {
            controlSocketRef.current?.close();
            telemetrySocketRef.current?.close();
            workerRef.current?.terminate(); // Worker termination should lead to it sending a 'Closed' state via its own logic
        };
    }, [signalingURL, reconnectInterval]); // set...State functions are stable

    const switchRobot = (robotIndex) => {
        const currentRobots = robotsRef.current;
        const controlSocket = controlSocketRef.current;
        if (controlSocket && isWebsocketOk(controlSocket)) {
            const robot = currentRobots[robotIndex];
            if (robot) {
                setSwitchingRobot(true);
                controlSocket.send(JSON.stringify({ type: 'switchRobot', robotId: robot.id }));
            } else {
                console.error(`Robot at index ${robotIndex} not found in current list:`, currentRobots);
            }
        }
    };

    const switchMode = (mode) => {
        const controlSocket = controlSocketRef.current;
        if (controlSocket && isWebsocketOk(controlSocket)) {
            controlSocket.send(JSON.stringify({ type: 'switchMode', mode }));
        }
    };

    const initBridge = (url) => {
        const controlSocket = controlSocketRef.current;
        if (controlSocket && isWebsocketOk(controlSocket)) {
            controlSocket.send(JSON.stringify({ type: 'initBridge', url }));
        }
    };

    const sendCommand = (command) => {
        const telemetrySocket = telemetrySocketRef.current;
        if (telemetrySocket && isWebsocketOk(telemetrySocket)) {
            telemetrySocket.send(JSON.stringify({ type: 'command', command }));
        }
    };

    const subscribeToTelemetry = (callback) => {
        const telemetrySocket = telemetrySocketRef.current;
        if (telemetrySocket && isWebsocketOk(telemetrySocket)) {
            telemetrySocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                callback(data);
            };
        }
    };

    const subscribeToPointCloudData = (callback) => {
        pointCloudSubscribersRef.current.push(callback);
        const unsubscribe = () => {
            pointCloudSubscribersRef.current = pointCloudSubscribersRef.current.filter(sub => sub !== callback);
        };
        return unsubscribe;
    };

    return (
        <RemoteRobotsContext.Provider value={{
            controlSocketState,
            telemetrySocketState,
            streamingSocketState,
            pointCloudRef,
            sessionStartDateRef,
            robots,
            selectedRobot,
            switchingRobot,
            switchRobot,
            switchMode,
            sendCommand,
            subscribeToTelemetry,
            subscribeToPointCloudData,
            initBridge,
        }}>
            {children}
        </RemoteRobotsContext.Provider>
    );
}
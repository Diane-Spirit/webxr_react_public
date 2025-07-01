import {useXRInputSourceState} from "@react-three/xr";
import {createContext, useContext, useRef, useState} from "react";
import {useFrame} from "@react-three/fiber";
import useRemoteRobots from "../hooks/RemoteRobotsHook.jsx";
import {ControllerSpaceContext} from "./ControllerSpace.jsx";
import useLatencyTest from "../hooks/useLatencyTest.jsx";

export const ControllerJoystickContext = createContext({});

export function ControllerJoystick({handedness = 'left'}) {
    const controllerState = useXRInputSourceState('controller', handedness);

    const leftControllerState = useXRInputSourceState('controller', 'left');
    const rightControllerState = useXRInputSourceState('controller', 'right');
    const inputSource = controllerState?.inputSource;
    const {sendCommand} = useRemoteRobots();
    const {setDebugString} = useContext(ControllerSpaceContext);
    const {testOnce, startContinuousTest, stopContinuousTest, abortCurrentTest} = useLatencyTest();

    const prevButtonXState = useRef(0); // Ref to store the previous state of buttonX
    const prevButtonYState = useRef(0); // Ref to store the previous state of buttonY
    const prevButtonAState = useRef(0); // Ref to store the previous state of buttonA
    const prevButtonBState = useRef(0); // Ref to store the previous state of buttonB
    const prevCommand = useRef(null); // Ref to store the previous command
    const [isThrottled, setIsThrottled] = useState(false); // State to manage throttling

    const throttlingInterval = 33; // Throttle interval in milliseconds

    useFrame(() => {
        if (inputSource && leftControllerState?.gamepad && rightControllerState?.gamepad) {
            const thumbstick = controllerState.gamepad['xr-standard-thumbstick'];
            const xButton = leftControllerState.gamepad['x-button'];
            const yButton = leftControllerState.gamepad['y-button'];
            const aButton = rightControllerState.gamepad['a-button']; // Standard name for A button
            const bButton = rightControllerState.gamepad['b-button']; // Standard name for B button

            if (!thumbstick) {
                console.log('Thumbstick not available');
                return;
            }

            let xAxis = thumbstick.xAxis;
            let yAxis = thumbstick.yAxis;
            let buttonX = xButton?.button || 0;
            let buttonY = yButton?.button || 0;
            let buttonA = aButton?.button || 0;
            let buttonB = bButton?.button || 0;

            // Check if buttonX just got pressed
            if (buttonX == 1 && prevButtonXState.current == 0) {
                console.log(`Button X on ${handedness} controller pressed!`);
                testOnce();
            }
            prevButtonXState.current = buttonX;

            // Check if buttonY just got pressed
            if (buttonY == 1 && prevButtonYState.current == 0) {
                console.log(`Button Y on ${handedness} controller pressed!`);
                abortCurrentTest();
            }

            // Check if buttonA just got pressed
            if (buttonA == 1 && prevButtonAState.current == 0) {
                console.log(`Button A on ${handedness} controller pressed! Starting continuous latency test.`);
                startContinuousTest();
            }
            prevButtonAState.current = buttonA;

            // Check if buttonB just got pressed
            if (buttonB == 1 && prevButtonBState.current == 0) {
                console.log(`Button B on ${handedness} controller pressed! Stopping continuous latency test and downloading CSV.`);
                stopContinuousTest();
            }
            prevButtonBState.current = buttonB;

            // Create the current command
            const currentCommand = {
                linear: {
                    x: -yAxis / 2,
                    y: 0,
                    z: 0,
                },
                angular: {
                    x: 0,
                    y: 0,
                    z: -xAxis / 2,
                },
            };

            // Compare with the previous command and throttle if necessary
            if (
                /* JSON.stringify(currentCommand) !== JSON.stringify(prevCommand.current) && */
                !isThrottled
            ) {
                sendCommand(currentCommand);
                prevCommand.current = currentCommand;

                // Throttle the command sending
                setIsThrottled(true);
                setTimeout(() => {
                    setIsThrottled(false);
                }, throttlingInterval); // Throttle interval in milliseconds
            }

            setDebugString(
                (-yAxis).toFixed(3) + " | " + (-xAxis).toFixed(3) + " | " + buttonY.toFixed(0) + " | " + buttonX.toFixed(0) + " | " + buttonA.toFixed(0) + " | " + buttonB.toFixed(0)
            );
        } else {
            // Reset button state and previous command if controller is disconnected or gamepad is missing
            prevButtonXState.current = 0;
            prevButtonYState.current = 0;
            prevButtonAState.current = 0;
            prevButtonBState.current = 0;
            prevCommand.current = null;
        }
    });

    return null;
}
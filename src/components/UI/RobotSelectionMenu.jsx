import {Button, Card} from "@react-three/uikit-apfel";
import {Container, Text} from "@react-three/uikit";
import {useContext, useEffect, useState} from "react";
import useScene from "../../hooks/SceneHook.jsx";
import {Toggle, ToggleGroup} from "@react-three/uikit-default";
import {ControllerSpaceContext} from "../../xr/ControllerSpace.jsx";
import useRemoteRobots from "../../hooks/RemoteRobotsHook.jsx";
import useLatencyTest from "../../hooks/useLatencyTest.jsx";

function RobotSelectionMenu() {
    const {
        robots,
        switchRobot,
        switchMode,
        controlSocketState,
        telemetrySocketState,
        streamingSocketState
    } = useRemoteRobots();
    const [robotIndex, setRobotIndex] = useState(0);
    const [modeToggle, setModeToggle] = useState(true);
    const {debugString} = useContext(ControllerSpaceContext);

    const {lastLatency} = useLatencyTest();
    const {setScene, setRoute} = useScene();

    useEffect(() => {
        switchMode(modeToggle ? 'FPV' : 'OTS');
    }, [modeToggle]);

    return (
        <>
            { /* Carousel content */}
            <Card borderTopLeftRadius={32} borderTopRightRadius={32}
                  borderBottomRadius={0} minWidth={300} // Added width here
                  paddingX={36} paddingY={24} gap={12} marginX={-36} marginTop={-36} flexDirection="column">

                <Container flexDirection={"column"} flexBasis={"100%"} flexGrow={1}>
                    <Text fontSize={14} fontWeight={600} alignSelf={"center"} marginBottom={4}>Debug String</Text>
                    <Text fontSize={16} fontWeight={400} alignSelf={"center"}>{debugString}</Text>
                </Container>

                <Container flexDirection={"column"} flexBasis={"100%"} flexGrow={1} marginTop={6} marginBottom={6}>
                    <Text fontSize={14} fontWeight={600} alignSelf={"center"} marginBottom={4}>Socket Status</Text>
                    <Container flexDirection={"column"} gap={2} alignItems={"flex-start"} paddingX={12} fontSize={12}>
                        <Container flexDirection={"row"} justifyContent={"space-between"} gap={4}>
                            <Text>Control: </Text>
                            <Text fontWeight={600} color={getSocketColor(controlSocketState)}>{controlSocketState}</Text>
                        </Container>
                        <Container flexDirection={"row"} justifyContent={"space-between"} gap={4}>
                            <Text>Telemetry: </Text>
                            <Text fontWeight={600} color={getSocketColor(telemetrySocketState)}>{telemetrySocketState}</Text>
                        </Container>
                        <Container flexDirection={"row"} justifyContent={"space-between"} gap={4}>
                            <Text>Streaming: </Text>
                            <Text fontWeight={600} color={getSocketColor(streamingSocketState)}>{streamingSocketState}</Text>
                        </Container>
                    </Container>
                </Container>

                <Container flexDirection={"column"} flexBasis={"100%"} flexGrow={1}>
                    <Text fontSize={14} fontWeight={600} alignSelf={"center"} marginBottom={4}>Network</Text>
                    <Container flexDirection={"row"} gap={12} justifyContent={"center"} alignItems={"center"}
                               flexBasis={"100%"} flexGrow={1}>
                        <Container gap={2}>
                            <Text fontSize={16} fontWeight={400} alignSelf={"center"}>BW</Text>
                            <Text fontSize={16} fontWeight={600} alignSelf={"center"}>N/A</Text>
                        </Container>
                        <Container gap={2}>
                            <Text fontSize={16} fontWeight={400} alignSelf={"center"}>RTT</Text>
                            <Text fontSize={16} fontWeight={600} alignSelf={"center"}>{lastLatency !== null ? `${lastLatency.toFixed(3)} ms` : "N/A"}</Text>
                        </Container>
                    </Container>
                </Container>

            </Card>

            {/* Carousel controls */}
            {robots?.length > 1 && (
                <Container positionType={"absolute"} positionTop={120} flexDirection={"row"} gap={8}
                           justifyContent={"space-between"} alignItems={"center"} width={"100%"} marginX={-32}
                           transformTranslateZ={32}>

                    <Button variant={"icon"} size={"md"} backgroundOpacity={1} backgroundColor={"#9f9f9f"} platter
                            active={{opacity: 0.5}} hover={{backgroundColor: "blue"}} marginLeft={-32}
                            transformRotateY={20}

                            onClick={() => {
                                setRobotIndex((robotIndex - 1 + robots.length) % robots.length);
                            }}
                    >
                        <Text fontSize={24} fontWeight={600} color={"white"}>&lt;</Text>
                    </Button>

                    <Button variant={"icon"} size={"md"} backgroundOpacity={1} backgroundColor={"#9f9f9f"} platter
                            active={{opacity: 0.5}} hover={{backgroundColor: "blue"}} marginRight={-32}
                            transformRotateY={-20}

                            onClick={() => {
                                setRobotIndex((robotIndex + 1) % robots.length);
                            }}
                    >
                        <Text fontSize={24} fontWeight={600} color={"white"} marginRight={-3}>&gt;</Text>
                    </Button>

                </Container>
            )}

            {
                robots?.length > 0 ? (<>

                {/* Robot information */}
                <Container flexDirection={"row"} gap={8} justifyContent={"space-between"} alignItems={"center"}
                           marginBottom={-28} marginX={-20}>

                    {/* Connection Status - TODO: Address connection status */}
                    <Container flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
                        <Text fontSize={10} fontWeight={600} alignSelf={"center"}>Connection</Text>
                        <Container flexDirection={"row"} justifyContent={"center"} alignItems={"center"}
                                   transformTranslateZ={10}>
                            <Text fontSize={30} fontWeight={600} alignSelf={"center"}
                                  marginTop={-16}>{'.'.repeat(robots[robotIndex].connectionState || 0)}</Text>
                            <Text fontSize={30} fontWeight={600} alignSelf={"center"} marginTop={-16}
                                  color={"grey"}>{'.'.repeat(5 - (robots[robotIndex].connectionState || 0))}</Text>
                        </Container>
                    </Container>

                    {/* Battery Status - TODO: Address battery status */}
                    <Container flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
                        <Text fontSize={10} fontWeight={600} alignSelf={"center"}>Battery</Text>
                        <Text fontSize={16} fontWeight={600} alignSelf={"center"}
                              transformTranslateZ={10}>{robots[robotIndex].battery || "N/A"}%</Text>
                    </Container>
                </Container>

                {/* Robot #ID + name */}
                <Container flexDirection={"row"} justifyContent={"center"} alignItems={"center"} gap={4}>
                    <Text fontSize={22} fontWeight={600} alignSelf={"center"}
                            transformTranslateZ={16}>{robots[robotIndex].name || "Unnamed"}</Text>
                    <Text fontSize={16} fontWeight={400} alignSelf={"center"} color={'grey'} marginTop={2}
                          transformTranslateZ={16}>#{robots[robotIndex].id || "?"}</Text>
                </Container>

                {/* Probably there will be no description in the end */}
                <Text fontSize={16} opacity={.85} alignSelf={"center"}>{robots[robotIndex].description || "Undefined"}</Text>

                {/* Control options 
                <Container flexDirection={"row"} gap={8} alignSelf={"center"} justifyContent={"center"}
                           alignItems={"center"} marginBottom={8}>
                    <ToggleGroup>
                        <Toggle defaultChecked={true} active={{backgroundOpacity: .1}}
                                hover={{backgroundColor: "white", backgroundOpacity: 0.05}}
                                checked={!modeToggle}
                                onCheckedChange={(checked) => setModeToggle(true)}
                        >
                            <Text fontSize={14} opacity={.85} alignSelf={"center"}>FPV</Text>
                        </Toggle>
                        <Toggle defaultChecked={false} active={{backgroundOpacity: .1}}
                                hover={{backgroundColor: "white", backgroundOpacity: 0.05}}
                                checked={modeToggle}
                                onCheckedChange={(checked) => setModeToggle(false)}
                        >
                            <Text fontSize={14} opacity={.85} alignSelf={"center"}>OTS</Text>
                        </Toggle>
                    </ToggleGroup>
                </Container>
                */}

                {/* Select button */}
                <Button variant="rect" size={"md"} platter active={{opacity: 0.5}} hover={{backgroundColor: "blue"}}

                        onClick={() => {
                            setScene("point-cloud");
                            switchRobot(robotIndex);
                        }}
                >
                    <Text fontSize={16} fontWeight={600}>Select</Text>
                </Button>

                {/* Select a robot message */}
                <Text alignSelf={"center"} fontSize={12} opacity={.75} marginBottom={-22}>
                    Select a robot to control.
                </Text>

            </>
                ) : (
            <Text alignSelf={"center"} fontSize={12} opacity={.75} marginBottom={-22}>
                No robots available.
            </Text>
            )}

            <Container positionType={"absolute"} positionBottom={-48} flexDirection={"row"} gap={8}
                       marginX={-32} justifyContent={"space-between"} alignItems={"center"} width={"100%"}>
                {/* Settings button
                <Button backgroundOpacity={.625} backgroundColor={"#9f9f9f"}
                        variant={"pill"} size={"sm"}
                        platter active={{opacity: 0.5}} onClick={() => {
                    setScene("welcome");
                    setRoute("welcome");
                }} hover={{backgroundColor: "blue"}}>
                    <Text fontSize={14} fontWeight={500}>Settings</Text>
                </Button>
                */}
                
                {/* Close button */}
                <Button backgroundOpacity={.625} backgroundColor={"#9f9f9f"}
                        variant={"pill"} size={"sm"} marginLeft={"auto"}
                        platter active={{opacity: 0.5}} onClick={() => {
                    setScene("welcome");
                    setRoute("welcome");
                }} hover={{backgroundColor: "red"}}>
                    <Text fontSize={14} fontWeight={500}>Close</Text>
                </Button>
            </Container>
        </>
    );
}

function getSocketColor(state) {
    const lowerState = state?.toLowerCase();
    switch (lowerState) {
        case 'connected':
        case 'open':
            return '#4CAF50'; // Green
        case 'connecting':
            return '#FF9800'; // Orange
        case 'disconnected':
        case 'closed':
        case 'error':
        case 'initializing':
            return '#F44336'; // Red
        default:
            return '#9E9E9E'; // Grey
    }
}

export default RobotSelectionMenu;
import React, { createContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useRemoteRobots from '../hooks/RemoteRobotsHook';

export const LatencyTestContext = createContext({});

const checkAllPointsPositionZero = (positionsArray) => {

    if (!positionsArray || positionsArray.length === 0) {
        return false;
    }

    if (positionsArray.length % 3 !== 0) {
        // console.warn('LatencyTest: Positions array length is not a multiple of 3. Assuming XYZ format.');
        return false;
    }

    for (let i = 0; i < 100; i += 3) {
        if (i + 2 >= positionsArray.length || positionsArray[i] !== 0 || positionsArray[i+1] !== 0 || positionsArray[i+2] !== 0) {
            return false; // Mismatch found
        }
    }

    return true; // All points match
};

const checkAllPointsMatchColor = (colorsArray, targetR, targetG, targetB) => {

    if (!colorsArray || colorsArray.length === 0) {
        return false;
    }
    if (colorsArray.length % 4 !== 0) {
        // console.warn('LatencyTest: Colors array length is not a multiple of 4. Assuming RGBA format.');
        return false;
    }
    for (let i = 0; i < 100; i += 4) {
        if (i + 2 >= colorsArray.length || colorsArray[i] !== targetR || colorsArray[i+1] !== targetG || colorsArray[i+2] !== targetB) {
            return false; // Mismatch found
        }
    }
    return true; // All points match
};

const formatDateForFilename = (date) => {
    if (!date) return "unknown_datetime";
    const pad = (num) => num.toString().padStart(2, '0');
    // Use UTC methods for consistent filenames regardless of local timezone
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}_${pad(date.getUTCHours())}-${pad(date.getUTCMinutes())}-${pad(date.getUTCSeconds())}Z`;
};

function downloadLatencyResultsCSV(latencyData, sessionStartDate) {
    if (!latencyData || latencyData.length === 0) {
        console.warn("No latency data to download.");
        return;
    }

    const header = "timestamp,latency_ms";
    // Convert corrected timestamp (milliseconds) to Unix timestamp (seconds)
    const rows = latencyData.map(entry => `${entry.timestamp / 1000},${typeof entry.latency === 'number' ? entry.latency : 'N/A'}`);
    const csvString = [header, ...rows].join("\n");

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const filenameTimestamp = formatDateForFilename(sessionStartDate); // sessionStartDate is expected to be a Date object, as provided by the caller.
    const filename = `latency_test_results_${filenameTimestamp}.csv`;

    if (link.download !== undefined) { // Feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        console.error("CSV download not supported by the browser.");
    }
}

export default function LatencyTestContextProvider({
    children,
    targetColor = [0, 255, 0]
}) {
    const { sendCommand, subscribeToPointCloudData, sessionStartDateRef } = useRemoteRobots();

    const [isTesting, setIsTesting] = useState(false); // Is a single test cycle active?
    const [lastLatency, setLastLatency] = useState(null);
    const [latencyResults, setLatencyResults] = useState([]);
    const [isContinuousTesting, setIsContinuousTesting] = useState(false); // Is continuous mode enabled?
    const startTimeRef = useRef(null);
    const testIdRef = useRef(0); // To differentiate test runs
    const initialUTCTimeRef = useRef(0); // Stores the UTC timestamp in ms at the point of time sync
    const initialPerformanceTimeRef = useRef(0); // Stores performance.now() in ms at the point of time sync

    const internalStartTestTrigger = useCallback(() => {
        if (!sendCommand) {
            console.error("LatencyTest: sendCommand function is not available.");
            setIsTesting(false); // Ensure isTesting is false if we can't proceed
            return false;
        }
        testIdRef.current += 1;
        startTimeRef.current = performance.now();
        setIsTesting(true); // Mark that a test cycle is now active
        
        sendCommand({
            linear:{
                x: 0,
                y: 0,
                z: 1, // Command to change color or point positions
            },
            angular:{
                x: 0,
                y: 0,
                z: 0
            }
        });

        console.log(`LatencyTest: Test ${testIdRef.current} triggered. Sent command.`);
        return true;
    }, [sendCommand, setIsTesting]);

    const processPointCloudFrame = useCallback((pointCloudData) => {
        if (!isTesting || startTimeRef.current === null) {
            // Not actively testing or test cycle not properly started
            return;
        }

        if (!pointCloudData || !pointCloudData.colors) {
            console.warn("LatencyTest: Received point cloud data without colors.");
            return;
        }

        const allMatch = checkAllPointsMatchColor(pointCloudData.colors, ...targetColor) || checkAllPointsPositionZero(pointCloudData.positions);

        if (allMatch) {
            const endTime = performance.now();
            const currentLatency = endTime - startTimeRef.current;
            setLastLatency(currentLatency);
            
            const currentPerformanceTime = performance.now();
            let correctedTimestamp;

            if (initialUTCTimeRef.current !== 0 && initialPerformanceTimeRef.current !== 0) {
                correctedTimestamp = initialUTCTimeRef.current + (currentPerformanceTime - initialPerformanceTimeRef.current);
            } else {
                // Fallback if sync data isn't available (e.g., single test mode, or before initial sync)
                correctedTimestamp = Date.now();
            }
            console.log(`LatencyTest: Color frame received for test ${testIdRef.current}. Latency: ${currentLatency.toFixed(2)}ms. Corrected Timestamp: ${new Date(correctedTimestamp).toISOString()}`);

            if (isContinuousTesting) {
                setLatencyResults(prevResults => [...prevResults, { timestamp: correctedTimestamp, latency: currentLatency, id: testIdRef.current }]);
                // Automatically start the next test in continuous mode
                if (!internalStartTestTrigger()) {
                    console.error("LatencyTest: Failed to trigger next test in continuous mode from processPointCloudFrame.");
                    setIsContinuousTesting(false); // Stop continuous mode if trigger fails
                    setIsTesting(false);
                }
            } else { // Single test mode
                setIsTesting(false);
                startTimeRef.current = null;
            }
        }
    }, [isTesting, isContinuousTesting, targetColor, setLatencyResults, setLastLatency, internalStartTestTrigger, setIsContinuousTesting, setIsTesting]);

    useEffect(() => {
        if (!subscribeToPointCloudData) {
            console.warn("LatencyTestContext: subscribeToPointCloudData is not available from RemoteRobotsContext.");
            return;
        }
        const unsubscribe = subscribeToPointCloudData(processPointCloudFrame);
        return () => {
            unsubscribe();
        };
    }, [subscribeToPointCloudData, processPointCloudFrame]);


    const testOnce = useCallback(() => {
        if (isTesting && startTimeRef.current !== null) { 
            console.warn("LatencyTest: A test cycle is already in progress.");
            return;
        }
        if (isContinuousTesting) {
            console.warn("LatencyTest: testOnce called while continuous testing is active. Continuous tests trigger automatically. To start a new continuous session, stop the current one first.");
            return;
        }
        // setIsTesting(true); // Moved to internalStartTestTrigger
        if (!internalStartTestTrigger()) {
            // internalStartTestTrigger will set isTesting to false if it fails early
            console.error("LatencyTest: Failed to start single test via testOnce.");
        }
    }, [isTesting, internalStartTestTrigger]);

    const startContinuousTest = useCallback(async () => {
        if (isTesting) {
            console.warn("LatencyTest: Cannot start continuous testing while a single test is already in progress. Please wait or abort.");
            return;
        }
        console.log("LatencyTest: Continuous testing mode enabled. Attempting to sync clock...");
        setIsContinuousTesting(true);
        setLatencyResults([]); // Clear previous results for the new session
/*
        try {
            const response = await fetch("https://timeapi.io/api/time/current/zone?timeZone=UTC");
            if (!response.ok) {
                throw new Error(`Time API request failed with status ${response.status}`);
            }
            const timeData = await response.json();
            const performanceTimeAtResponse = performance.now(); // Capture performance time at response

            // API month is 1-indexed, JS Date month is 0-indexed
            const trueUTCTime = new Date(Date.UTC(
                timeData.year,
                timeData.month - 1,
                timeData.day,
                timeData.hour,
                timeData.minute,
                timeData.seconds,
                timeData.milliSeconds
            ));

            initialUTCTimeRef.current = trueUTCTime.getTime();
            initialPerformanceTimeRef.current = performanceTimeAtResponse;

            console.log(`LatencyTest: Clock synced. Initial UTC: ${new Date(initialUTCTimeRef.current).toISOString()}, Initial Perf Time: ${initialPerformanceTimeRef.current.toFixed(2)}ms. Session start (UTC): ${trueUTCTime.toISOString()}`);

        } catch (error) {
            console.error("LatencyTest: Failed to sync clock with timeapi.io. Timestamps will be based on local time at session start + performance.now() delta.", error);
            initialUTCTimeRef.current = Date.now(); // Fallback to local current time as base
            initialPerformanceTimeRef.current = performance.now(); // Corresponding performance time
            console.log(`LatencyTest: Using local time as base. Initial Local Time: ${new Date(initialUTCTimeRef.current).toISOString()}, Initial Perf Time: ${initialPerformanceTimeRef.current.toFixed(2)}ms.`);
        }
            */

        initialUTCTimeRef.current = Date.now(); // Fallback to local current time as base
        initialPerformanceTimeRef.current = performance.now(); // Corresponding performance time

        console.log("LatencyTest: Starting first test...");
        if (!internalStartTestTrigger()) {
            console.error("LatencyTest: Failed to start the first test in continuous mode.");
            setIsContinuousTesting(false); // Revert if the first trigger fails
        }
    }, [isTesting, internalStartTestTrigger, setIsContinuousTesting, setLatencyResults]);

    const stopContinuousTest = useCallback(() => {
        console.log("LatencyTest: Continuous testing mode disabled.");
        setIsContinuousTesting(false);
        setIsTesting(false); // Ensure any active test cycle is marked as stopped
        startTimeRef.current = null;
        if (latencyResults.length > 0) {
            downloadLatencyResultsCSV(latencyResults, sessionStartDateRef.current);
            setLatencyResults([]); // Clear results after download to prevent re-download of the same data
        }
    }, [latencyResults, setIsContinuousTesting, setIsTesting, setLatencyResults]);

    const abortCurrentTest = useCallback(() => {
        if (isTesting) { // A test cycle is active (waiting for response)
            console.log(`LatencyTest: Aborting current test measurement (ID: ${testIdRef.current}).`);
            startTimeRef.current = null;
            setIsTesting(false);
            // If in continuous mode, this also stops the chain of tests.
        } else {
            console.log("LatencyTest: No active test measurement to abort.");
        }
    }, [isTesting, setIsTesting]);

    const clearResults = useCallback(() => {
        setLatencyResults([]);
    }, []);
    
    const averageLatency = useMemo(() => {
        if (latencyResults.length === 0) return 0;
        const sum = latencyResults.reduce((acc, curr) => acc + curr.latency, 0);
        return sum / latencyResults.length;
    }, [latencyResults]);

    const manualColorFrameReceived = useCallback(() => {
        if (!isTesting || startTimeRef.current === null) {
            console.warn(
                "LatencyTest: manualColorFrameReceived called but not actively testing or start time not recorded for current cycle."
            );
            return;
        }
        const endTime = performance.now();
        const currentLatency = endTime - startTimeRef.current;
        setLastLatency(currentLatency);

        const currentPerformanceTime = performance.now();
        let correctedTimestamp;

        if (initialUTCTimeRef.current !== 0 && initialPerformanceTimeRef.current !== 0) {
            correctedTimestamp = initialUTCTimeRef.current + (currentPerformanceTime - initialPerformanceTimeRef.current);
        } else {
            // Fallback if sync data isn't available
            correctedTimestamp = Date.now();
        }
        console.log(`LatencyTest: Manual color frame received for test ${testIdRef.current}. Latency: ${currentLatency.toFixed(2)}ms. Corrected Timestamp: ${new Date(correctedTimestamp).toISOString()}`);

        if (isContinuousTesting) {
            setLatencyResults(prevResults => [...prevResults, { timestamp: correctedTimestamp, latency: currentLatency, id: testIdRef.current, manual: true }]);
            // Automatically start the next test in continuous mode
            if (!internalStartTestTrigger()) {
                console.error("LatencyTest: Failed to trigger next test in continuous mode from manualColorFrameReceived.");
                setIsContinuousTesting(false); // Stop continuous mode if trigger fails
                setIsTesting(false);
            }
        } else {
             // Single test mode with manual trigger
            setIsTesting(false);
            startTimeRef.current = null;
        }
    }, [isTesting, isContinuousTesting, setLatencyResults, setLastLatency, internalStartTestTrigger, setIsContinuousTesting, setIsTesting]);

    return (
        <LatencyTestContext.Provider value={{
            testOnce,
            startContinuousTest,
            stopContinuousTest,
            abortCurrentTest,
            manualColorFrameReceived,
            sessionStartDateRef,
            latencyResults,
            lastLatency,
            isTesting,
            isContinuousTesting,
            clearResults,
            averageLatency,
            currentTargetColor: targetColor
        }}>
            {children}
        </LatencyTestContext.Provider>
    );
}
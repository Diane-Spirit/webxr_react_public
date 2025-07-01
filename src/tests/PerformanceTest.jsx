import React, { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { PointCloudObject } from '../three/PointCloudObject';
import { saveAs } from 'file-saver';  // To save CSV file

const PerformanceTest = ({ minPoints = 50000, maxPoints = 2000000, stepPoints = 50000, pointSize = 20, testDuration = 1 }) => {
    const { scene } = useThree();
    const [results, setResults] = useState([]);
    const [testComplete, setTestComplete] = useState(false);
    const pointCloudRef = useRef(null);
    const frameRef = useRef(null);

    useEffect(() => {
        const runTest = async () => {
            const pointCloud = new PointCloudObject(pointSize);
            pointCloudRef.current = pointCloud;

            scene.add(pointCloud.getObject());

            for (let pointCount = minPoints; pointCount <= maxPoints; pointCount += stepPoints) {
                console.log(`Testing with ${pointCount} points`);
                pointCloud.loadRandom(pointCount);
                await logPerformance(pointCount, testDuration);
            }

            setTestComplete(true);
            scene.remove(pointCloud.getObject());
        };

        runTest();

        return () => {
            if (pointCloudRef.current) {
                scene.remove(pointCloudRef.current.getObject());
            }
        };
    }, [scene, minPoints, maxPoints, stepPoints, pointSize, testDuration]);

    useEffect(() => {
        if (testComplete) {
            saveResultsToCSV();
        }
    }, [testComplete]);

    const logPerformance = (pointCount, duration) => {
        return new Promise((resolve) => {
            const startTime = performance.now();
            let frameCount = 0;

            const measureFPS = () => {
                frameCount++;
                const elapsed = (performance.now() - startTime) / 1000;
                if (elapsed >= duration) {
                    const fps = frameCount / elapsed;
                    console.log(`Points: ${pointCount}, FPS: ${fps.toFixed(2)}`);
                    setResults((prevResults) => [...prevResults, { pointCount, fps }]);
                    resolve();
                } else {
                    frameRef.current = requestAnimationFrame(measureFPS);
                }
            };

            frameRef.current = requestAnimationFrame(measureFPS);
        });
    };

    const saveResultsToCSV = () => {
        let csvContent = "Points,FPS\n";

        console.log(results);

        results.forEach(result => {
            csvContent += `${result.pointCount},${result.fps.toFixed(2)}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'threejs.csv');
    };

    return null; // No visible JSX
};

export default PerformanceTest;
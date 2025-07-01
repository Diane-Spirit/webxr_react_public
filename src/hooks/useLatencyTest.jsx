import { useContext } from 'react';
import { LatencyTestContext } from '../providers/LatencyTestContext';

export default function useLatencyTest() {
    const context = useContext(LatencyTestContext);
    if (context === undefined) {
        throw new Error('useLatencyTest must be used within a LatencyTestContextProvider');
    }
    return context;
}
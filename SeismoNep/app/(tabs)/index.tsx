
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { fetchRecentEarthquakes } from '../../lib/earthquakes';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
    const [stats, setStats] = useState({
        total: 0,
        today: 0,
        avgMagnitude: 0,
    });

    useEffect(() => {
        fetchRecentEarthquakes()
            .then(data => {
                const today = new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                });
                const todayEvents = data.filter((e: { date: string; }) => {
                    // Convert date format MM/DD/YYYY to compare with today
                    return e.date === today;
                });
                const avgMag = data.length > 0 
                    ? (data.reduce((sum: any, e: { magnitude: any; }) => sum + e.magnitude, 0) / data.length).toFixed(1)
                    : 0;
                
                setStats({
                    total: data.length,
                    today: todayEvents.length,
                    avgMagnitude: Number(avgMag),
                });
            })
            .catch(() => {});
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#ff0000']}
                style={styles.gradient}
            />
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.infoText}>Monitor Earthquake Activity In Nepal</Text>
            
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="analytics" size={32} color="#fff" />
                    <Text style={styles.statNumber}>{stats.total}</Text>
                    <Text style={styles.statLabel}>This Month</Text>
                </View>
                
                <View style={styles.statCard}>
                    <Ionicons name="today" size={32} color="#fff" />
                    <Text style={styles.statNumber}>{stats.today}</Text>
                    <Text style={styles.statLabel}>Today</Text>
                </View>
                
                <View style={styles.statCard}>
                    <Ionicons name="speedometer" size={32} color="#fff" />
                    <Text style={styles.statNumber}>{stats.avgMagnitude}</Text>
                    <Text style={styles.statLabel}>Avg Magnitude</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    title: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 16,
    },
    infoText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 40,
    },
    statCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        minWidth: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    statNumber: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 8,
    },
    statLabel: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
});

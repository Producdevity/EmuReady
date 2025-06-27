# Health Endpoint Usage

The `/api/health` endpoint provides real-time server health monitoring, perfect for React Native apps, load balancers, and monitoring systems.

## Endpoint Details

- **URL**: `/api/health`
- **Method**: `GET`
- **Authentication**: None required (public endpoint)
- **Content-Type**: `application/json`

## Response Format

### Healthy Response (200)
```json
{
  "status": "healthy",
  "timestamp": "2025-06-27T15:15:59.513Z",
  "uptime": 7,
  "version": "0.7.27",
  "environment": "development",
  "services": {
    "database": {
      "status": "connected",
      "latency": 593
    },
    "auth": {
      "status": "available"
    }
  },
  "system": {
    "memory": {
      "used": 550,
      "total": 676,
      "percentage": 81
    },
    "nodeVersion": "v22.16.0"
  }
}
```

### Unhealthy Response (503)
```json
{
  "status": "unhealthy",
  "timestamp": "2025-06-27T15:15:59.513Z",
  "error": "Database connection failed"
}
```

## React Native Usage

### Basic Health Check
```typescript
const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://your-api-domain.com/api/health', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout for mobile networks
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (response.ok) {
      const healthData = await response.json();
      return healthData.status === 'healthy';
    }
    
    return false;
  } catch (error) {
    console.warn('Health check failed:', error);
    return false;
  }
};
```

### Health Monitoring Hook
```typescript
import { useState, useEffect, useRef } from 'react';

interface HealthStatus {
  isHealthy: boolean;
  lastChecked: Date | null;
  error: string | null;
  isChecking: boolean;
}

export const useServerHealth = (intervalMs: number = 30000) => {
  const [health, setHealth] = useState<HealthStatus>({
    isHealthy: false,
    lastChecked: null,
    error: null,
    isChecking: false,
  });
  
  const intervalRef = useRef<NodeJS.Timeout>();

  const checkHealth = async () => {
    setHealth(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      const response = await fetch('https://your-api-domain.com/api/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        setHealth({
          isHealthy: data.status === 'healthy',
          lastChecked: new Date(),
          error: null,
          isChecking: false,
        });
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error) {
      setHealth({
        isHealthy: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        isChecking: false,
      });
    }
  };

  useEffect(() => {
    // Initial check
    checkHealth();
    
    // Set up interval
    intervalRef.current = setInterval(checkHealth, intervalMs);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMs]);

  return {
    ...health,
    checkNow: checkHealth,
  };
};
```

### Usage in React Native Component
```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useServerHealth } from './useServerHealth';

export const ServerStatusIndicator = () => {
  const { isHealthy, lastChecked, error, isChecking, checkNow } = useServerHealth(30000);

  return (
    <View style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: isHealthy ? '#10B981' : '#EF4444',
            marginRight: 8,
          }}
        />
        <Text style={{ fontWeight: 'bold' }}>
          Server: {isHealthy ? 'Online' : 'Offline'}
        </Text>
      </View>
      
      {lastChecked && (
        <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          Last checked: {lastChecked.toLocaleTimeString()}
        </Text>
      )}
      
      {error && (
        <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
          Error: {error}
        </Text>
      )}
      
      <TouchableOpacity
        onPress={checkNow}
        disabled={isChecking}
        style={{
          backgroundColor: '#3B82F6',
          padding: 8,
          borderRadius: 4,
          marginTop: 8,
          opacity: isChecking ? 0.5 : 1,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {isChecking ? 'Checking...' : 'Check Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

## Use Cases

### 1. App Startup Check
Check server availability when the app starts to show appropriate messaging to users.

### 2. Network Connectivity Monitoring
Continuously monitor server health to detect network issues and inform users about connectivity problems.

### 3. Offline Mode Detection
Use health checks to determine when to switch to offline mode or cached data.

### 4. Load Balancer Health Checks
Configure load balancers to use this endpoint for determining server health.

### 5. Monitoring & Alerting
Set up monitoring systems to track server health and alert on issues.

## Response Fields Explained

- **status**: Overall health status (`healthy` | `unhealthy`)
- **timestamp**: ISO timestamp of when the check was performed
- **uptime**: Server uptime in seconds
- **version**: Application version for compatibility checking
- **environment**: Current environment (development, production)
- **services.database**: Database connectivity and response time
- **services.auth**: Authentication service availability
- **system.memory**: Memory usage statistics
- **system.nodeVersion**: Node.js version for debugging

## Best Practices

1. **Implement Timeouts**: Always use timeouts for health checks (recommended: 10 seconds)
2. **Handle Failures Gracefully**: Don't crash the app if health checks fail
3. **Cache Results**: Avoid too frequent checks to save battery and bandwidth
4. **User Feedback**: Show users when the server is unavailable
5. **Retry Logic**: Implement exponential backoff for failed checks
6. **Background Checks**: Perform health checks in the background when the app is active

## Error Scenarios

The health endpoint will return a 503 status code when:
- Database connection fails
- Critical services are unavailable
- Server is overloaded
- Internal errors occur

Your React Native app should handle these scenarios appropriately by:
- Showing offline indicators
- Caching data locally
- Providing retry mechanisms
- Informing users about service issues 
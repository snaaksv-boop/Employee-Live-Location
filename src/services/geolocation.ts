import { api } from './api';

export interface GeoPositionData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  timestamp: string;
}

export interface GeoState {
  isTracking: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied';
  lastPosition: GeoPositionData | null;
  error: string | null;
  accuracyWarning: boolean;
  isOnline: boolean;
  pendingOfflineCount: number;
}

type Listener = (state: GeoState) => void;

class GeolocationService {
  private watchId: number | null = null;
  private currentEmployeeId: string | null = null;
  private state: GeoState = {
    isTracking: false,
    permissionStatus: 'prompt',
    lastPosition: null,
    error: null,
    accuracyWarning: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingOfflineCount: 0,
  };
  private listeners: Set<Listener> = new Set();
  private readonly STORAGE_KEY = 'fieldwork_offline_gps_queue';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      this.updateOfflineQueueCount();
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  public getState(): GeoState {
    return { ...this.state };
  }

  private handleOnline = () => {
    this.state.isOnline = true;
    this.state.error = null;
    this.notify();
    this.flushOfflineQueue();
  };

  private handleOffline = () => {
    this.state.isOnline = false;
    this.notify();
  };

  private getOfflineQueue(): any[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setOfflineQueue(queue: any[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
      this.state.pendingOfflineCount = queue.length;
      this.notify();
    } catch (e) {
      console.error('Failed saving offline GPS points to localStorage', e);
    }
  }

  private updateOfflineQueueCount() {
    const queue = this.getOfflineQueue();
    this.state.pendingOfflineCount = queue.length;
    this.notify();
  }

  public async flushOfflineQueue(): Promise<number> {
    if (!this.currentEmployeeId || !navigator.onLine) return 0;
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return 0;

    try {
      const res = await api.batchSyncLocations(this.currentEmployeeId, queue);
      if (res.success) {
        this.setOfflineQueue([]);
        return res.syncedCount || queue.length;
      }
    } catch (err) {
      console.warn('Failed to flush offline queue:', err);
    }
    return 0;
  }

  public async startTracking(employeeId: string): Promise<boolean> {
    this.currentEmployeeId = employeeId;

    if (!('geolocation' in navigator)) {
      this.state.error = 'Browser Geolocation API is not supported on this device/browser.';
      this.state.permissionStatus = 'denied';
      this.notify();
      return false;
    }

    try {
      // Check permission state if permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        this.state.permissionStatus = permission.state;
        permission.onchange = () => {
          this.state.permissionStatus = permission.state;
          if (permission.state === 'denied') {
            this.state.error = 'Location access was revoked in browser settings.';
            this.stopTracking();
          }
          this.notify();
        };
      }
    } catch {
      // Permissions API not supported or restricted, proceed to watchPosition
    }

    this.state.isTracking = true;
    this.state.error = null;
    this.notify();

    // Configure high accuracy options
    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (pos: GeolocationPosition) => {
        const posData: GeoPositionData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed != null ? pos.coords.speed * 3.6 : null, // convert m/s to km/h
          heading: pos.coords.heading,
          altitude: pos.coords.altitude,
          timestamp: new Date(pos.timestamp).toISOString(),
        };

        this.state.lastPosition = posData;
        this.state.permissionStatus = 'granted';
        this.state.error = null;
        this.state.accuracyWarning = pos.coords.accuracy > 40;
        this.notify();

        // Dispatch to server if online, else store in offline local buffer
        if (navigator.onLine) {
          api
            .sendLocationUpdate({
              employeeId,
              latitude: posData.latitude,
              longitude: posData.longitude,
              accuracy: posData.accuracy,
              speed: posData.speed,
              heading: posData.heading,
              timestamp: posData.timestamp,
              isOfflineSynced: false,
              locationType: posData.accuracy > 40 ? 'approx' : 'gps',
            })
            .catch((err) => {
              console.warn('Network error while posting location point, queuing locally:', err);
              this.queueOfflinePoint(posData);
            });
        } else {
          this.queueOfflinePoint(posData);
        }
      },
      (err: GeolocationPositionError) => {
        let msg = 'Failed to acquire device location fix.';
        if (err.code === 1) {
          msg = 'Location permission denied by user. Please allow location access in your browser.';
          this.state.permissionStatus = 'denied';
          this.state.isTracking = false;
        } else if (err.code === 2) {
          msg = 'GPS signal unavailable or device is in high-interference zone.';
        } else if (err.code === 3) {
          msg = 'Location request timed out. Retrying with device sensors...';
        }
        this.state.error = msg;
        this.notify();
      },
      geoOptions
    );

    return true;
  }

  private queueOfflinePoint(posData: GeoPositionData) {
    const queue = this.getOfflineQueue();
    queue.push(posData);
    this.setOfflineQueue(queue);
  }

  public stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.state.isTracking = false;
    this.notify();
  }
}

export const geoService = new GeolocationService();

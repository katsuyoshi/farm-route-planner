import { useState, useEffect, useCallback, useRef } from "react";
import type { Position } from "../algorithm/types";

export interface GpsState {
  /** Current position [lng, lat] in GeoJSON convention */
  position: Position | null;
  /** Accuracy in meters */
  accuracy: number | null;
  /** Heading in degrees (null if not moving / unavailable) */
  heading: number | null;
  /** Whether GPS is actively tracking */
  isTracking: boolean;
  /** Error message if GPS fails */
  error: string | null;
}

export function useGpsTracking() {
  const [state, setState] = useState<GpsState>({
    position: null,
    accuracy: null,
    heading: null,
    isTracking: false,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        error: "お使いのブラウザはGPS機能に対応していません",
      }));
      return;
    }

    setState((s) => ({ ...s, isTracking: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState((s) => ({
          ...s,
          position: [pos.coords.longitude, pos.coords.latitude],
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          error: null,
        }));
      },
      (err) => {
        let message: string;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = "位置情報の使用が許可されていません";
            break;
          case err.POSITION_UNAVAILABLE:
            message = "位置情報を取得できません";
            break;
          case err.TIMEOUT:
            message = "位置情報の取得がタイムアウトしました";
            break;
          default:
            message = "位置情報の取得に失敗しました";
        }
        setState((s) => ({ ...s, error: message, isTracking: false }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      },
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((s) => ({ ...s, isTracking: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { ...state, startTracking, stopTracking };
}

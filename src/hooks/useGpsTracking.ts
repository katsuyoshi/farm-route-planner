import { useState, useEffect, useCallback, useRef } from "react";
import type { Position } from "../algorithm/types";

export interface GpsState {
  /** Raw GPS position [lng, lat] before offset */
  rawPosition: Position | null;
  /** Current position [lng, lat] with offset applied */
  position: Position | null;
  /** Accuracy in meters */
  accuracy: number | null;
  /** Heading in degrees (null if not moving / unavailable) */
  heading: number | null;
  /** Whether GPS is actively tracking */
  isTracking: boolean;
  /** Error message if GPS fails */
  error: string | null;
  /** Current offset [lng, lat] in degrees */
  offset: Position;
}

/** 1 meter in degrees at a given latitude */
function metersToDegreesLng(lat: number): number {
  return 1 / (111320 * Math.cos((lat * Math.PI) / 180));
}
const METER_TO_DEG_LAT = 1 / 110574;

export function useGpsTracking() {
  const [state, setState] = useState<GpsState>({
    rawPosition: null,
    position: null,
    accuracy: null,
    heading: null,
    isTracking: false,
    error: null,
    offset: [0, 0],
  });

  const watchIdRef = useRef<number | null>(null);
  const offsetRef = useRef<Position>([0, 0]);

  const applyOffset = (raw: Position): Position => {
    return [raw[0] + offsetRef.current[0], raw[1] + offsetRef.current[1]];
  };

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
        const raw: Position = [pos.coords.longitude, pos.coords.latitude];
        setState((s) => ({
          ...s,
          rawPosition: raw,
          position: applyOffset(raw),
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

  /** Calibrate: set offset so current GPS position matches the given target */
  const calibrate = useCallback((target: Position) => {
    setState((s) => {
      if (!s.rawPosition) return s;
      const newOffset: Position = [
        target[0] - s.rawPosition[0],
        target[1] - s.rawPosition[1],
      ];
      offsetRef.current = newOffset;
      return {
        ...s,
        offset: newOffset,
        position: applyOffset(s.rawPosition),
      };
    });
  }, []);

  /** Nudge offset by given meters in a direction */
  const nudgeOffset = useCallback(
    (direction: "north" | "south" | "east" | "west", meters: number) => {
      setState((s) => {
        const lat = s.rawPosition ? s.rawPosition[1] : 39;
        const dlng = metersToDegreesLng(lat) * meters;
        const dlat = METER_TO_DEG_LAT * meters;

        let newOffset: Position;
        switch (direction) {
          case "north":
            newOffset = [offsetRef.current[0], offsetRef.current[1] + dlat];
            break;
          case "south":
            newOffset = [offsetRef.current[0], offsetRef.current[1] - dlat];
            break;
          case "east":
            newOffset = [offsetRef.current[0] + dlng, offsetRef.current[1]];
            break;
          case "west":
            newOffset = [offsetRef.current[0] - dlng, offsetRef.current[1]];
            break;
        }
        offsetRef.current = newOffset;
        return {
          ...s,
          offset: newOffset,
          position: s.rawPosition ? applyOffset(s.rawPosition) : null,
        };
      });
    },
    [],
  );

  /** Reset offset to zero */
  const resetOffset = useCallback(() => {
    offsetRef.current = [0, 0];
    setState((s) => ({
      ...s,
      offset: [0, 0],
      position: s.rawPosition,
    }));
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    calibrate,
    nudgeOffset,
    resetOffset,
  };
}

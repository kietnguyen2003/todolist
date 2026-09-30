import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { todayReducer, type TodayAction, type TodayState } from '../today/model';
import { decodeTodayState, emptyTodayState, encodeTodayState, TODAY_STORAGE_KEY } from './codec';

type Snapshot = { state: TodayState; revision: number };
type Action = { type: 'hydrate'; state: TodayState } | { type: 'edit'; action: TodayAction };
function reducer(snapshot: Snapshot, action: Action): Snapshot {
  if (action.type === 'hydrate') return { state: action.state, revision: 0 };
  const state = todayReducer(snapshot.state, action.action);
  return state === snapshot.state ? snapshot : { state, revision: snapshot.revision + 1 };
}

export function usePersistentTodayState() {
  const [snapshot, send] = useReducer(reducer, undefined, () => ({ state: emptyTodayState(), revision: 0 }));
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<'load' | 'save' | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const mounted = useRef(false);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const writeSequence = useRef(0);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    AsyncStorage.getItem(TODAY_STORAGE_KEY).then(raw => {
      const state = decodeTodayState(raw);
      if (cancelled) return;
      send({ type: 'hydrate', state });
      setFailure(null);
      setReady(true);
    }).catch(() => { if (!cancelled) setFailure('load'); });
    return () => { cancelled = true; };
  }, [loadAttempt]);

  useEffect(() => {
    if (!ready || snapshot.revision === 0) return;
    const sequence = ++writeSequence.current;
    // All writes run in order, including retries, so an older value cannot win a race.
    writeQueue.current = writeQueue.current.then(async () => {
      try {
        await AsyncStorage.setItem(TODAY_STORAGE_KEY, encodeTodayState(snapshot.state));
        if (mounted.current && sequence === writeSequence.current) setFailure(null);
      } catch {
        if (mounted.current && sequence === writeSequence.current) setFailure('save');
      }
    });
  }, [ready, snapshot, saveAttempt]);

  const dispatch = useCallback((action: TodayAction) => {
    if (ready) send({ type: 'edit', action });
  }, [ready]);
  const retry = useCallback(() => {
    if (failure === 'load') setLoadAttempt(value => value + 1);
    if (failure === 'save') setSaveAttempt(value => value + 1);
  }, [failure]);
  const error = failure === 'load'
    ? 'Không thể đọc dữ liệu trên máy. Dữ liệu cũ vẫn được giữ nguyên. Hãy thử lại.'
    : failure === 'save'
      ? 'Chưa lưu được thay đổi trên máy. Hãy thử lại trước khi đóng ứng dụng.'
      : null;
  return { state: snapshot.state, dispatch, ready, error, retry };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { PantryState } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function usePantry(householdId: string | null) {
  const [state, setState] = useState<PantryState>(() => {
    if (typeof window !== 'undefined' && householdId) {
      const cached = localStorage.getItem(`pantry_state_${householdId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return {
      locations: [],
      zones: [],
      items: [],
      shoppingList: [],
      library: [],
      mealPlans: [],
    };
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!householdId) return;

    let socket: WebSocket;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${window.location.host}`);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        socket.send(JSON.stringify({ type: 'subscribe', householdId }));
        
        // Replay queued actions
        const queuedActionsStr = localStorage.getItem(`pantry_queue_${householdId}`);
        if (queuedActionsStr) {
          try {
            const queuedActions = JSON.parse(queuedActionsStr);
            if (queuedActions.length > 0) {
              setIsSyncing(true);
              queuedActions.forEach((action: any) => {
                socket.send(JSON.stringify({ type: 'action', action }));
              });
              localStorage.removeItem(`pantry_queue_${householdId}`);
              
              // Dispatch custom event for toast
              window.dispatchEvent(new CustomEvent('pantry-sync-complete'));
              
              setTimeout(() => setIsSyncing(false), 1500);
            }
          } catch (e) {
            console.error('Failed to replay queued actions', e);
          }
        }
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'init' || data.type === 'update') {
          setState(data.state);
          localStorage.setItem(`pantry_state_${householdId}`, JSON.stringify(data.state));
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect
        reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
      };
      
      socket.onerror = () => {
        // Error will trigger close, which triggers reconnect
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [householdId]);

  const dispatch = useCallback((action: { type: string; payload: any }) => {
    // Ensure ADD actions have an ID so offline updates to them work
    if ((action.type === 'ADD_ITEM' || action.type === 'ADD_TO_SHOPPING') && !action.payload.id) {
      action.payload.id = uuidv4();
    }

    console.log('Dispatching action:', action);
    
    if (socketRef.current?.readyState === WebSocket.OPEN && navigator.onLine) {
      socketRef.current.send(JSON.stringify({ type: 'action', action }));
    } else {
      console.warn('Offline. Queuing action:', action);
      if (householdId) {
        const queueStr = localStorage.getItem(`pantry_queue_${householdId}`);
        const queue = queueStr ? JSON.parse(queueStr) : [];
        queue.push(action);
        localStorage.setItem(`pantry_queue_${householdId}`, JSON.stringify(queue));
        
        // Optimistic UI update
        setState(prevState => optimisticUpdate(prevState, action));
      }
    }
  }, [householdId]);

  return { state, isConnected, isSyncing, dispatch };
}

function optimisticUpdate(state: PantryState, action: any): PantryState {
  const { type, payload } = action;
  const newState = { ...state };
  
  try {
    switch (type) {
      case 'ADD_ITEM':
        const existingItem = newState.items.find(i => 
          i.name.toLowerCase() === payload.name.toLowerCase() && 
          i.storageCategory === payload.storageCategory && 
          i.zone_id === (payload.zone_id || payload.zoneId)
        );
        if (existingItem) {
          newState.items = newState.items.map(i => 
            i.id === existingItem.id ? { ...i, quantity: (i.quantity || 0) + (payload.quantity || 0) } : i
          );
        } else {
          newState.items = [...newState.items, { ...payload, id: payload.id || 'temp-' + Date.now() }];
        }
        break;
      case 'UPDATE_ITEM':
        newState.items = newState.items.map(i => i.id === payload.id ? { ...i, ...payload } : i);
        break;
      case 'DELETE_ITEM':
        newState.items = newState.items.filter(i => i.id !== payload.id);
        break;
      case 'MARK_PURCHASED':
        newState.shoppingList = newState.shoppingList.map(i => i.id === payload.id ? { ...i, purchased: 1 } : i);
        break;
      case 'DELETE_SHOPPING_ITEM':
        newState.shoppingList = newState.shoppingList.filter(i => i.id !== payload.id);
        break;
      case 'ADD_TO_SHOPPING':
        const existingShopping = newState.shoppingList.find(i => 
          i.name.toLowerCase() === payload.name.toLowerCase() && 
          i.shoppingCategory === payload.shoppingCategory && 
          i.purchased === 0
        );
        if (existingShopping) {
          newState.shoppingList = newState.shoppingList.map(i => 
            i.id === existingShopping.id ? { ...i, quantity: (i.quantity || 0) + (payload.quantity || 1) } : i
          );
        } else {
          newState.shoppingList = [...newState.shoppingList, { ...payload, id: payload.id || 'temp-' + Date.now(), purchased: 0 }];
        }
        break;
      case 'UPDATE_SHOPPING_ITEM':
        newState.shoppingList = newState.shoppingList.map(i => i.id === payload.id ? { ...i, ...payload } : i);
        break;
      case 'TRANSFER_ITEM':
        newState.items = newState.items.map(i => i.id === (payload.item_id || payload.itemId) ? { ...i, zone_id: (payload.target_zone_id || payload.targetZoneId) } : i);
        break;
      case 'BULK_TRANSFER_ITEMS':
        newState.items = newState.items.map(i => payload.itemIds.includes(i.id) ? { ...i, zone_id: payload.targetZoneId } : i);
        break;
      case 'CLEAR_PURCHASED':
        newState.shoppingList = newState.shoppingList.filter(i => i.purchased !== 1);
        break;
      case 'UPDATE_MEAL_PLAN':
        const existingMealIdx = newState.mealPlans.findIndex(m => m.id === payload.id);
        if (existingMealIdx >= 0) {
          newState.mealPlans = newState.mealPlans.map(m => m.id === payload.id ? { ...m, ...payload } : m);
        } else {
          newState.mealPlans = [...newState.mealPlans, payload];
        }
        break;
      case 'DELETE_MEAL_PLAN':
        newState.mealPlans = newState.mealPlans.filter(m => m.id !== payload.id);
        break;
    }
  } catch (e) {
    console.error("Optimistic update failed", e);
  }
  
  return newState;
}

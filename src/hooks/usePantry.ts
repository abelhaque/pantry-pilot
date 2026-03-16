import { useState, useEffect, useCallback } from 'react';
import { PantryState, Item, Location, Zone } from '../types';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export function usePantry(householdId: string | null) {
  const [state, setState] = useState<PantryState>({
    locations: [],
    zones: [],
    items: [],
    shoppingList: [],
    library: [],
    mealPlans: [],
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!householdId) return;
    setIsSyncing(true);
    
    try {
      const [
        { data: items, error: itemsError },
        { data: locations, error: locationsError },
        { data: zones, error: zonesError },
        { data: shoppingList, error: shoppingError }
      ] = await Promise.all([
        supabase.from('items').select('*').eq('household_id', householdId),
        supabase.from('locations').select('*').eq('household_id', householdId),
        supabase.from('zones').select('*'),
        supabase.from('shopping_list').select('*').eq('household_id', householdId)
      ]);

      if (itemsError) console.warn('Supabase items error (likely table missing):', itemsError.message);
      if (locationsError) console.warn('Supabase locations error:', locationsError.message);
      if (zonesError) console.warn('Supabase zones error:', zonesError.message);
      if (shoppingError) console.warn('Supabase shopping error:', shoppingError.message);

      setState(prev => ({
        ...prev,
        items: items || [],
        locations: locations || [],
        zones: zones || [],
        shoppingList: shoppingList || [],
      }));
      setIsConnected(true);
    } catch (error) {
      console.error('Supabase Error (catch):', error);
      setIsConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;

    fetchData();

    // Set up Realtime subscriptions
    const itemsSubscription = supabase
      .channel('pantry-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `household_id=eq.${householdId}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations', filter: `household_id=eq.${householdId}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list', filter: `household_id=eq.${householdId}` }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(itemsSubscription);
    };
  }, [householdId, fetchData]);

  const dispatch = useCallback(async (action: { type: string; payload: any }) => {
    if (!householdId) return;

    const { type, payload } = action;
    
    try {
      switch (type) {
        case 'ADD_ITEM':
          await supabase.from('items').insert([{ ...payload, household_id: householdId, id: payload.id || uuidv4() }]);
          break;
        case 'UPDATE_ITEM':
          await supabase.from('items').update(payload).eq('id', payload.id);
          break;
        case 'DELETE_ITEM':
          await supabase.from('items').delete().eq('id', payload.id);
          break;
        case 'ADD_TO_SHOPPING':
          await supabase.from('shopping_list').insert([{ ...payload, household_id: householdId, id: payload.id || uuidv4() }]);
          break;
        case 'UPDATE_SHOPPING_ITEM':
          await supabase.from('shopping_list').update(payload).eq('id', payload.id);
          break;
        case 'DELETE_SHOPPING_ITEM':
          await supabase.from('shopping_list').delete().eq('id', payload.id);
          break;
        case 'MARK_PURCHASED':
          await supabase.from('shopping_list').update({ purchased: 1 }).eq('id', payload.id);
          break;
        case 'CLEAR_PURCHASED':
          await supabase.from('shopping_list').delete().eq('purchased', 1).eq('household_id', householdId);
          await fetchData();
          break;
        case 'TRANSFER_ITEM':
          await supabase.from('items').update({ zone_id: payload.targetZoneId }).eq('id', payload.itemId);
          break;
        case 'BULK_TRANSFER_ITEMS':
          await supabase.from('items').update({ zone_id: payload.targetZoneId }).in('id', payload.itemIds);
          break;
      }
    } catch (error) {
      console.error(`Error performing action ${type}:`, error);
    }
  }, [householdId, fetchData]);

  return { state, isConnected, isSyncing, refresh: fetchData, dispatch };
}


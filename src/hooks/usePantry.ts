import { useState, useEffect, useCallback } from 'react';
import { PantryState, Item, Location, Zone } from '../types';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const FALLBACK_HOUSEHOLD_ID = '0ff3dd01-23f5-4efc-9092-d22fb7217406';

export function usePantry(householdId: string | null) {
  // Use the provided householdId OR the hardcoded force-linked ID if unsure
  const currentHouseholdId = householdId || FALLBACK_HOUSEHOLD_ID;

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
    // Explicitly log the householdId we are using for the fetch
    console.log('Fetching data for Household ID:', currentHouseholdId);
    setIsSyncing(true);
    
    try {
      // Use currentHouseholdId for all queries
      const itemsQuery = supabase.from('items').select('*').eq('household_id', currentHouseholdId);
      const locationsQuery = supabase.from('locations').select('*').eq('household_id', currentHouseholdId);
      const shoppingQuery = supabase.from('shopping_list').select('*').eq('household_id', currentHouseholdId);

      const [
        { data: items, error: itemsError },
        { data: locations, error: locationsError },
        { data: zones, error: zonesError },
        { data: shoppingList, error: shoppingError }
      ] = await Promise.all([
        itemsQuery,
        locationsQuery,
        supabase.from('zones').select('*'),
        shoppingQuery
      ]);

      // EMERGENCY LOGGING: Log exactly what Supabase returns
      console.log('API RESPONSE [locations]:', locations);
      console.log('API RESPONSE [items]:', items);
      if (locationsError) console.error('API ERROR [locations]:', locationsError);
      if (itemsError) console.error('API ERROR [items]:', itemsError);

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
  }, [currentHouseholdId]);

  useEffect(() => {
    if (!currentHouseholdId) return;

    fetchData();

    // Set up Realtime subscriptions
    const itemsSubscription = supabase
      .channel('pantry-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `household_id=eq.${currentHouseholdId}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations', filter: `household_id=eq.${currentHouseholdId}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list', filter: `household_id=eq.${currentHouseholdId}` }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(itemsSubscription);
    };
  }, [currentHouseholdId, fetchData]);

  const dispatch = useCallback(async (action: { type: string; payload: any }) => {
    if (!currentHouseholdId) return;

    const { type, payload } = action;
    
    try {
      switch (type) {
        case 'ADD_ITEM': {
          const newItem = { ...payload, household_id: currentHouseholdId, id: payload.id || uuidv4() };
          console.log('DEBUG [ADD_ITEM]: Adding item to household_id:', currentHouseholdId, newItem);
          const { error } = await supabase.from('items').insert([newItem]);
          if (error) console.error('DEBUG [ADD_ITEM] API ERROR:', error);
          break;
        }
        case 'UPDATE_ITEM':
          await supabase.from('items').update(payload).eq('id', payload.id);
          break;
        case 'DELETE_ITEM':
          await supabase.from('items').delete().eq('id', payload.id);
          break;
        case 'ADD_TO_SHOPPING': {
          const newShoppingItem = { ...payload, household_id: currentHouseholdId, id: payload.id || uuidv4() };
          console.log('DEBUG [ADD_TO_SHOPPING]: Adding item to household_id:', currentHouseholdId, newShoppingItem);
          const { error } = await supabase.from('shopping_list').insert([newShoppingItem]);
          if (error) console.error('DEBUG [ADD_TO_SHOPPING] API ERROR:', error);
          break;
        }
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
          await supabase.from('shopping_list').delete().eq('purchased', 1).eq('household_id', currentHouseholdId);
          await fetchData();
          break;
        case 'TRANSFER_ITEM':
          await supabase.from('items').update({ zone_id: payload.targetZoneId }).eq('id', payload.itemId);
          break;
        case 'BULK_TRANSFER_ITEMS':
          await supabase.from('items').update({ zone_id: payload.targetZoneId }).in('id', payload.itemIds);
          break;
        case 'ADD_LOCATION': {
          const locationId = uuidv4();
          const { error: locError } = await supabase.from('locations').insert([{ 
            ...payload, 
            household_id: currentHouseholdId, 
            id: locationId 
          }]);
          if (locError) throw locError;
          
          // Auto-create 'Main' zone for the new location
          const { error: zoneError } = await supabase.from('zones').insert([{
            id: uuidv4(),
            name: 'Main',
            location_id: locationId
          }]);
          if (zoneError) throw zoneError;
          
          await fetchData();
          break;
        }
        case 'UPDATE_LOCATION':
          await supabase.from('locations').update(payload).eq('id', payload.id);
          await fetchData();
          break;
        case 'DELETE_LOCATION':
          // Items and zones should be handled by DB cascade or handled explicitly here
          // For safety, let's just delete the location and rely on fetch for fresh state
          await supabase.from('locations').delete().eq('id', payload.id);
          await fetchData();
          break;
      }
    } catch (error) {
      console.error(`Error performing action ${type}:`, error);
    }
  }, [currentHouseholdId, fetchData]);

  return { state, isConnected, isSyncing, refresh: fetchData, dispatch };
}



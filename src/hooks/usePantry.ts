import { useState, useEffect, useCallback } from 'react';
import { PantryState, Item, Location, Zone } from '../types';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const STRICT_HOUSEHOLD_ID = '0ff3dd01-23f5-4efc-9092-d22fb7217406';

// Utility to remove any keys that are undefined, null, or empty strings
const cleanPayload = (obj: any) => {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== '') {
      cleaned[key] = val;
    }
  });
  return cleaned;
};

export function usePantry(_ignoredHouseholdId: string | null) {
  // STRICT MODE: Hard-coded force-linked ID. No dynamic detection.
  const currentHouseholdId = STRICT_HOUSEHOLD_ID;

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
    console.log('STRICT MODE: Fetching data for Household ID:', currentHouseholdId);
    setIsSyncing(true);
    
    try {
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

      if (itemsError) window.alert('Supabase Items Error: ' + itemsError.message);
      if (locationsError) window.alert('Supabase Locations Error: ' + locationsError.message);
      if (zonesError) window.alert('Supabase Zones Error: ' + zonesError.message);
      if (shoppingError) window.alert('Supabase Shopping Error: ' + shoppingError.message);

      setState(prev => ({
        ...prev,
        items: items || [],
        locations: locations || [],
        zones: zones || [],
        shoppingList: shoppingList || [],
      }));
      setIsConnected(true);
    } catch (error: any) {
      window.alert('Critical Data Fetch Error: ' + (error?.message || 'Unknown error'));
      setIsConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, [currentHouseholdId]);

  useEffect(() => {
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
    const { type, payload } = action;
    
    try {
      switch (type) {
        case 'ADD_ITEM': {
          const rawItem = { 
            id: payload.id || uuidv4(),
            name: payload.name, 
            quantity: payload.quantity,
            household_id: currentHouseholdId, 
            zone_id: payload.zone_id,
            category: payload.storageCategory || payload.category || 'Other',
            icon: payload.icon || '📦',
            unit_type: payload.unit_type || 'items',
            expiry_date: payload.expiry_date,
            low_stock_threshold: payload.low_stock_threshold
          };
          
          const cleanItem = cleanPayload(rawItem);
          console.log('STRICT MODE [ADD_ITEM] (Clean):', cleanItem);
          
          const { error } = await supabase.from('items').insert([cleanItem]);
          if (error) window.alert('Add Item Error: ' + error.message);
          break;
        }
        case 'UPDATE_ITEM': {
          const cleanUpdate = cleanPayload(payload);
          // Force category mapping if it's renamed in payload
          if (payload.storageCategory) cleanUpdate.category = payload.storageCategory;
          
          const { error } = await supabase.from('items').update(cleanUpdate).eq('id', payload.id);
          if (error) window.alert('Update Item Error: ' + error.message);
          break;
        }
        case 'DELETE_ITEM': {
          const { error } = await supabase.from('items').delete().eq('id', payload.id);
          if (error) window.alert('Delete Item Error: ' + error.message);
          break;
        }
        case 'ADD_TO_SHOPPING': {
          const rawShoppingItem = { 
            id: payload.id || uuidv4(),
            name: payload.name,
            quantity: payload.quantity,
            household_id: currentHouseholdId, 
            category: payload.shoppingCategory || payload.category || 'Other',
            icon: payload.icon || '📦',
            unit_type: payload.unit_type || 'items',
            store: payload.store,
            item_id: payload.item_id // Optional reference
          };
          
          const cleanShoppingItem = cleanPayload(rawShoppingItem);
          console.log('STRICT MODE [ADD_TO_SHOPPING] (Clean):', cleanShoppingItem);
          
          const { error } = await supabase.from('shopping_list').insert([cleanShoppingItem]);
          if (error) window.alert('Add Shopping Item Error: ' + error.message);
          break;
        }
        case 'UPDATE_SHOPPING_ITEM': {
          const cleanUpdate = cleanPayload(payload);
          if (payload.shoppingCategory) cleanUpdate.category = payload.shoppingCategory;
          
          const { error } = await supabase.from('shopping_list').update(cleanUpdate).eq('id', payload.id);
          if (error) window.alert('Update Shopping Error: ' + error.message);
          break;
        }
        }
        case 'DELETE_SHOPPING_ITEM': {
          const { error } = await supabase.from('shopping_list').delete().eq('id', payload.id);
          if (error) window.alert('Delete Shopping Error: ' + error.message);
          break;
        }
        case 'MARK_PURCHASED': {
          const { error } = await supabase.from('shopping_list').update({ purchased: 1 }).eq('id', payload.id);
          if (error) window.alert('Mark Purchased Error: ' + error.message);
          break;
        }
        case 'CLEAR_PURCHASED': {
          const { error } = await supabase.from('shopping_list').delete().eq('purchased', 1).eq('household_id', currentHouseholdId);
          if (error) window.alert('Clear Purchased Error: ' + error.message);
          await fetchData();
          break;
        }
        case 'TRANSFER_ITEM': {
          const { error } = await supabase.from('items').update({ zone_id: payload.targetZoneId }).eq('id', payload.itemId);
          if (error) window.alert('Transfer Error: ' + error.message);
          break;
        }
        case 'BULK_TRANSFER_ITEMS': {
          const { error } = await supabase.from('items').update({ zone_id: payload.targetZoneId }).in('id', payload.itemIds);
          if (error) window.alert('Bulk Transfer Error: ' + error.message);
          break;
        }
        case 'ADD_LOCATION': {
          const locationId = uuidv4();
          const { error: locError } = await supabase.from('locations').insert([{ 
            ...payload, 
            household_id: currentHouseholdId, 
            id: locationId 
          }]);
          if (locError) {
             window.alert('Add Location Error: ' + locError.message);
             throw locError;
          }
          
          // Auto-create 'Main' zone for the new location
          const { error: zoneError } = await supabase.from('zones').insert([{
            id: uuidv4(),
            name: 'Main',
            location_id: locationId
          }]);
          if (zoneError) window.alert('Add Zone Error: ' + zoneError.message);
          
          await fetchData();
          break;
        }
        case 'UPDATE_LOCATION': {
          const { error } = await supabase.from('locations').update(payload).eq('id', payload.id);
          if (error) window.alert('Update Location Error: ' + error.message);
          await fetchData();
          break;
        }
        case 'DELETE_LOCATION': {
          const { error } = await supabase.from('locations').delete().eq('id', payload.id);
          if (error) window.alert('Delete Location Error: ' + error.message);
          await fetchData();
          break;
        }
      }
    } catch (error: any) {
      window.alert('Critical Action Error: ' + (error?.message || 'Unknown error'));
    }
  }, [currentHouseholdId, fetchData]);

  return { state, isConnected, isSyncing, refresh: fetchData, dispatch };
}




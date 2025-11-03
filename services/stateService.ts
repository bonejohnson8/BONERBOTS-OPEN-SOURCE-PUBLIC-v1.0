// services/stateService.ts
import { supabase, isAppConfigured } from './supabaseClient';
// Fix: Imported BotState and SerializableBotState for type correctness.
import { ArenaState } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const CHANNEL_NAME = 'arena-state';
const EVENT_NAME = 'broadcast';

let channel: RealtimeChannel | null = null;

export const updateState = async (newState: ArenaState) => {
  if (!isAppConfigured || !supabase) return;
  if (!channel) {
    channel = supabase.channel(CHANNEL_NAME);
  }
  
  try {
    channel.send({
      type: 'broadcast',
      event: EVENT_NAME,
      payload: newState,
    });
  } catch (error) {
    console.error('Error broadcasting state to Supabase:', error);
  }
};

export const subscribeToStateChanges = (callback: (newState: ArenaState) => void): RealtimeChannel | null => {
  if (!isAppConfigured || !supabase) return null;
  
  const stateChannel = supabase
    .channel(CHANNEL_NAME)
    .on('broadcast', { event: EVENT_NAME }, ({ payload }) => {
      callback(payload);
    })
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to arena state updates.');
        }
        if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to arena state updates.');
        }
    });

  return stateChannel;
};

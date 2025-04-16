import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri'

export default function MessageBoard() {
    const [message, setMessage] = useState('');
  
    useEffect(() => {
      const fetchMessage = async () => {
        try {
          const result = await invoke('get_message');
          setMessage(result);
                
        } catch (error) {
          console.error('Error fetching message:', error);
        }
      };
  
      fetchMessage();
    }, []);
  
    return (
      <div className="h-full w-full bg-blue-500 text-white flex justify-center items-center text-2xl">
        {message || 'Loading message...'}
      </div>
    );
  }

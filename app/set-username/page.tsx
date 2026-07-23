'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SetUsernamePage() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  const handleSetUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage('You must be logged in.');
      return;
    }

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      username: username.trim(),
    });

    if (error) {
      if (error.message.includes('duplicate')) {
        setMessage('That username is already taken. Try another.');
      } else {
        setMessage('Error: ' + error.message);
      }
      return;
    }

    window.location.href = '/stock';
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', fontFamily: 'sans-serif' }}>
      <h1>Choose a username</h1>
      <p style={{ color: '#666' }}>This cannot be changed later, so choose carefully.</p>
      <form onSubmit={handleSetUsername}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
          required
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Confirm Username</button>
      </form>
      {message && <p style={{ color: 'red' }}>{message}</p>}
    </div>
  );
}
import React, { useState } from 'react';

const Announcements = ({ onAnnouncement, onStop }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    onAnnouncement(message);
    setMessage('');
  };

  const handlePreset = (presetMessage) => {
    onAnnouncement(presetMessage);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full pt-[1.2vh] pb-[1vh] bg-cyan-400 border-style-line border-y border-cyan-800 flex items-center px-4 space-x-4"
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your message"
        className="flex-grow h-8 px-4 border border-gray-400 rounded"
      />
      <button
        type="submit"
        className="h-8 px-6 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Submit
      </button>
      <button
        type="button"
        onClick={() => handlePreset('Chow')}
        className="h-8 px-6 bg-green-900 text-white rounded hover:bg-green-800"
      >
        Chow
      </button>
      <button
        type="button"
        onClick={() => handlePreset('Movement')}
        className="h-8 px-6 bg-green-900 text-white rounded hover:bg-green-800"
      >
        Movement
      </button>
      <button
        type="button"
        onClick={onStop}
        className="h-8 px-6 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Stop
      </button>
    </form>
  );
};

export default Announcements;

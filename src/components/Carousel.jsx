import React, {useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri'
import Announcements from './Announcements';

export default function Carousel() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [timer, setTimer] = useState(601);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const result = await invoke('get_images');
        setImages(result);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [images, isPaused]);

  useEffect(() => {
    if (timer > 0 && isPaused) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }

    if (timer <= 0) {
      setIsPaused(false);
      setAnnouncement(null);
    }
  }, [timer, isPaused]);

  const stopAnnouncement = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/reset', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to stop the message');
    } catch (error) {
      console.error('Error stopping announcement:', error);
    }

    setIsPaused(false);
    setAnnouncement(null);
  };

  const handleAnnouncement = async (message) => {
    setIsPaused(true);
    setAnnouncement(message);
    setTimer(601);

    try {
      const response = await fetch('http://localhost:3000/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error('Failed to send announcement');
    } catch (error) {
      console.error('Error sending announcement:', error);
    }
  };

  return (
    <div className="h-full w-full flex border-style-line border-r border-cyan-800 flex-col items-center justify-center">
  {announcement ? (
    <div
      className={`w-full h-full flex flex-col items-center justify-center ${
        timer % 2 === 0 ? 'bg-black text-yellow-400' : 'bg-yellow-400 text-black'
      }`}
    >
      <p className="text-2xl font-bold">{announcement}</p>
      <p className="text-sm mt-2">Resuming in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</p>
    </div>
  ) : (
    <div className="h-[45vh] w-full flex justify-center items-center">
      {images.length > 0 ? (
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="h-full w-full object-contain"
        />
      ) : (
        <div>No images available</div>
      )}
    </div>
  )}
  <Announcements onAnnouncement={handleAnnouncement} onStop={stopAnnouncement} />
</div>
  );
}

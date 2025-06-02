import React, { useState, useEffect, useRef } from 'react';
import './ChatWidget.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialBotMessage: Message = {
    id: 'initial-bot-message',
    text: "Hi! I'm the FitFlow assistant. How can I help you navigate to workouts, nutrition, or weight tracking today?",
    sender: 'bot',
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([initialBotMessage]);
    }
  }, [isOpen]); // Removed messages.length from dependency to avoid loop with initial message

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);
  };

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentMessage.trim() === '') return;

    const newUserMessage: Message = {
      id: new Date().toISOString() + '-user',
      text: currentMessage,
      sender: 'user',
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setCurrentMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: new Date().toISOString() + '-bot',
        text: "Thanks for your message! I'm still learning. For now, you can find Workouts, Nutrition, and Weight tracking in the main menu.",
        sender: 'bot',
      };
      setMessages((prevMessages) => [...prevMessages, botResponse]);
    }, 1000);
  };

  return (
    <>
      <button className="chat-widget-button" onClick={toggleChat} aria-label="Toggle Chat">
        {isOpen ? '✕' : '💬'} {/* Simple icons for now */}
      </button>

      {/* Use conditional rendering and a class for open/close animations */}
      <div className={`chat-window ${isOpen ? 'open' : 'closed'}`}>
        <div className="chat-window-header">
          <span>FitFlow Assistant</span>
          <button onClick={toggleChat} className="close-button" aria-label="Close Chat">✕</button>
        </div>
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* For auto-scrolling */}
        </div>
        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={currentMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            aria-label="Chat message input"
          />
          <button type="submit" className="btn-primary">Send</button>
        </form>
      </div>
    </>
  );
};

export default ChatWidget;

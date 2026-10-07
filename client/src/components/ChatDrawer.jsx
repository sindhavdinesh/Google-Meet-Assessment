import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Paperclip, Download, FileText, Image as ImageIcon } from 'lucide-react';

export default function ChatDrawer({
  messages = [],
  onSendMessage,
  onShareFile,
  onClose,
  currentUserId
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds the 15MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onShareFile({
        fileName: file.name,
        fileType: file.type,
        fileSize: formatBytes(file.size),
        fileData: reader.result
      });
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="side-drawer">
      <div className="drawer-header">
        <h3>In-call messages</h3>
        <button className="icon-btn-round" onClick={onClose} title="Close">
          <X size={20} />
        </button>
      </div>

      <div className="chat-disclaimer-box">
        Messages can be seen only by people in the call and are deleted when the call ends.
      </div>

      <div className="drawer-body">
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#5f6368', marginTop: '40px', fontSize: '14px' }}>
              No messages yet. Send a message to start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className="chat-bubble-card">
                  <div className="chat-bubble-meta">
                    <span className="chat-bubble-sender">{isMine ? 'You' : msg.senderName}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {msg.type === 'file' ? (
                    <div className="file-attachment-bubble">
                      {msg.fileType.startsWith('image/') ? (
                        <ImageIcon size={26} color="#1a73e8" />
                      ) : (
                        <FileText size={26} color="#1a73e8" />
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div className="file-name" title={msg.fileName}>{msg.fileName}</div>
                        <div className="file-size">{msg.fileSize}</div>
                      </div>
                      <a
                        href={msg.fileData}
                        download={msg.fileName}
                        className="file-download-btn"
                        title="Download file"
                      >
                        <Download size={13} />
                        <span>Save</span>
                      </a>
                    </div>
                  ) : (
                    <div className="chat-bubble-text">{msg.text}</div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="chat-input-bar">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="icon-btn-round"
          onClick={() => fileInputRef.current?.click()}
          title="Share a file"
        >
          <Paperclip size={20} />
        </button>

        <input
          type="text"
          className="chat-text-input"
          placeholder="Send a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        <button
          type="submit"
          className="icon-btn-round"
          disabled={!inputText.trim()}
          style={{ color: inputText.trim() ? '#1a73e8' : '#9aa0a6' }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

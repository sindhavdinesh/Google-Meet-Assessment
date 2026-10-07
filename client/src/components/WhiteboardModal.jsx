import React, { useRef, useEffect, useState } from 'react';
import { X, Trash2, Download, Edit2, Eraser } from 'lucide-react';

const COLORS = ['#000000', '#ea4335', '#1a73e8', '#34a853', '#fbbc04', '#9334e8'];

export default function WhiteboardModal({ socket, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (socket) {
      socket.on('draw-action', (data) => {
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.lineWidth;
        ctx.beginPath();
        ctx.moveTo(data.prevX, data.prevY);
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
      });

      socket.on('clear-board', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }

    return () => {
      if (socket) {
        socket.off('draw-action');
        socket.off('clear-board');
      }
    };
  }, [socket]);

  const prevPosRef = useRef({ x: 0, y: 0 });

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const coords = getCanvasCoords(e);
    prevPosRef.current = coords;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCanvasCoords(e);

    const activeColor = isEraser ? '#ffffff' : color;
    const activeWidth = isEraser ? lineWidth * 3 : lineWidth;

    ctx.strokeStyle = activeColor;
    ctx.lineWidth = activeWidth;
    ctx.beginPath();
    ctx.moveTo(prevPosRef.current.x, prevPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    if (socket) {
      socket.emit('draw-action', {
        prevX: prevPosRef.current.x,
        prevY: prevPosRef.current.y,
        x: coords.x,
        y: coords.y,
        color: activeColor,
        lineWidth: activeWidth
      });
    }

    prevPosRef.current = coords;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (socket) {
      socket.emit('clear-board');
    }
  };

  const handleSaveImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `meeting-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="whiteboard-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Whiteboard Toolbar */}
        <div className="whiteboard-toolbar">
          <div className="whiteboard-tools-row">
            <span style={{ fontSize: '15px', fontWeight: 500, marginRight: '8px' }}>Whiteboard</span>

            {/* Colors */}
            {COLORS.map((c) => (
              <div
                key={c}
                className={`color-dot-pick ${color === c && !isEraser ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
              />
            ))}

            <div style={{ width: '1px', height: '24px', background: '#dadce0', margin: '0 8px' }} />

            {/* Pen vs Eraser */}
            <button
              className={`icon-btn-round ${!isEraser ? 'active' : ''}`}
              onClick={() => setIsEraser(false)}
              title="Pen tool"
            >
              <Edit2 size={18} color={!isEraser ? '#1a73e8' : '#5f6368'} />
            </button>

            <button
              className={`icon-btn-round ${isEraser ? 'active' : ''}`}
              onClick={() => setIsEraser(true)}
              title="Eraser tool"
            >
              <Eraser size={18} color={isEraser ? '#1a73e8' : '#5f6368'} />
            </button>

            {/* Clear Board */}
            <button className="icon-btn-round" onClick={handleClear} title="Clear board">
              <Trash2 size={18} color="#ea4335" />
            </button>

            {/* Save PNG */}
            <button className="icon-btn-round" onClick={handleSaveImage} title="Save drawing">
              <Download size={18} color="#1a73e8" />
            </button>
          </div>

          <button className="icon-btn-round" onClick={onClose} title="Close whiteboard">
            <X size={20} />
          </button>
        </div>

        {/* Whiteboard Canvas */}
        <canvas
          ref={canvasRef}
          style={{ flex: 1, cursor: 'crosshair', background: '#ffffff' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
}

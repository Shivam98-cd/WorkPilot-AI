import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * NetworkGraph - Enhanced network visualization of integrations
 * Shows WorkPilot AI at the center with connected integrations as nodes
 * Features: Search, drag nodes, sync animation, connection strength, keyboard shortcuts
 */

const NetworkGraph = ({ integrations = [], onNodeClick, onSync, syncing = false }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'connected', 'available'
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [nodePositionsOverride, setNodePositionsOverride] = useState({});
  const [syncPulse, setSyncPulse] = useState(false);
  const animationFrameRef = useRef(null);
  const particlesRef = useRef([]);

  // Sync animation trigger
  useEffect(() => {
    if (syncing) {
      setSyncPulse(true);
      const timer = setTimeout(() => setSyncPulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncing]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Cmd/Ctrl + F to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('network-search')?.focus();
      }
      // Escape to clear search
      if (e.key === 'Escape') {
        setSearchQuery('');
        setTooltip({ show: false, x: 0, y: 0, data: null });
      }
      // 1, 2, 3 for filters
      if (e.key === '1') setFilter('all');
      if (e.key === '2') setFilter('connected');
      if (e.key === '3') setFilter('available');
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = Math.max(600, Math.min(800, window.innerHeight - 250));
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Filter integrations based on search and filter
  const filteredIntegrations = integrations.filter(ig => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      ig.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ig.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'connected' ? ig.connected :
      filter === 'available' ? !ig.connected : true;
    
    return matchesSearch && matchesFilter;
  });

  // Calculate node positions in a circle
  const getNodePositions = () => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;

    const connected = filteredIntegrations.filter(i => i.connected);
    const available = filteredIntegrations.filter(i => !i.connected);

    const positions = [];

    // Connected nodes - inner circle
    const innerRadius = radius * 0.85;
    connected.forEach((node, i) => {
      const angle = (i * 2 * Math.PI) / connected.length - Math.PI / 2;
      const defaultX = centerX + innerRadius * Math.cos(angle);
      const defaultY = centerY + innerRadius * Math.sin(angle);
      
      // Use override position if exists
      const override = nodePositionsOverride[node.platform];
      
      positions.push({
        ...node,
        x: override?.x ?? defaultX,
        y: override?.y ?? defaultY,
        type: 'connected'
      });
    });

    // Available nodes - outer circle
    const outerRadius = radius * 1.3;
    available.forEach((node, i) => {
      const angle = (i * 2 * Math.PI) / available.length - Math.PI / 2;
      const defaultX = centerX + outerRadius * Math.cos(angle);
      const defaultY = centerY + outerRadius * Math.sin(angle);
      
      const override = nodePositionsOverride[node.platform];
      
      positions.push({
        ...node,
        x: override?.x ?? defaultX,
        y: override?.y ?? defaultY,
        type: 'available'
      });
    });

    return positions;
  };

  const nodePositions = getNodePositions();
  const centerX = dimensions.width / 2 + pan.x;
  const centerY = dimensions.height / 2 + pan.y;

  // Sync animation effect
  useEffect(() => {
    if (syncingAll) {
      syncAnimationRef.current = 1;
      const timer = setTimeout(() => {
        syncAnimationRef.current = 0;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [syncingAll]);

  // Particle system for data flow
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      time += 0.01;

      // Sync animation - make particles faster and brighter
      const syncBoost = syncAnimationRef.current;
      const particleSpeed = syncBoost > 0 ? 0.03 : 0.01;
      
      // Draw particles for connected nodes
      calculatedNodePositions
        .filter(n => n.connected)
        .forEach((node, idx) => {
          // Create particle effect
          const particleCount = syncBoost > 0 ? 5 : 3;
          for (let i = 0; i < particleCount; i++) {
            const progress = ((time + idx * 0.5 + i * 0.3) % 1);
            const x = node.x + (centerX - node.x) * progress;
            const y = node.y + (centerY - node.y) * progress;
            
            const opacity = Math.sin(progress * Math.PI);
            const size = 3 * opacity;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            
            // Color based on status
            const color = node.healthStatus === 'healthy' ? '16, 185, 129' :
                         node.healthStatus === 'degraded' ? '245, 158, 11' :
                         '139, 92, 246';
            
            ctx.fillStyle = `rgba(${color}, ${opacity * 0.8})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `rgba(${color}, ${opacity})`;
            ctx.fill();
          }
        });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [calculatedNodePositions, dimensions, centerX, centerY, syncingAll]);

  // Handle node hover
  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let foundNode = null;

    // Check center hub
    const distToCenter = Math.sqrt(
      Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
    );
    if (distToCenter < 90) {
      foundNode = 'center';
    }

    // Check integration nodes
    if (!foundNode) {
      calculatedNodePositions.forEach(node => {
        const dist = Math.sqrt(
          Math.pow(mouseX - node.x, 2) + Math.pow(mouseY - node.y, 2)
        );
        if (dist < 35) {
          foundNode = node;
        }
      });
    }

    setHoveredNode(foundNode);

    if (foundNode && foundNode !== 'center') {
      setTooltip({
        show: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        data: foundNode
      });
    } else {
      setTooltip({ show: false, x: 0, y: 0, data: null });
    }
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
    setTooltip({ show: false, x: 0, y: 0, data: null });
  };

  const handleNodeClick = (node) => {
    if (node && node !== 'center' && onNodeClick) {
      onNodeClick(node);
    }
  };

  // Node dragging handlers
  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    setDraggedNode(node.platform);
  };

  const handleNodeDrag = (e) => {
    if (!draggedNode) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setNodePositions(prev => ({
      ...prev,
      [draggedNode]: { x, y }
    }));
  };

  const handleNodeMouseUp = () => {
    setDraggedNode(null);
  };

  // Pan handlers
  const handlePanStart = (e) => {
    if (e.target === containerRef.current || e.target.tagName === 'svg' || e.target.tagName === 'canvas') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handlePanMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(2, prev * delta)));
  };

  // Reset view
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setNodePositions({});
  };

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: dimensions.height,
        background: 'linear-gradient(180deg, #000000 0%, #0a0a14 100%)',
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Canvas for particles */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
      />

      {/* SVG for connections */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
      >
        <defs>
          {/* Gradient for center hub */}
          <radialGradient id="centerGradient">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </radialGradient>

          {/* Glow filters */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines */}
        {nodePositions
          .filter(n => n.connected)
          .map((node, i) => {
            const color = node.healthStatus === 'healthy' ? '#10b981' :
                         node.healthStatus === 'degraded' ? '#f59e0b' :
                         '#8b5cf6';
            
            return (
              <line
                key={i}
                x1={node.x}
                y1={node.y}
                x2={centerX}
                y2={centerY}
                stroke={color}
                strokeWidth={hoveredNode === node ? 3 : 2}
                strokeOpacity={0.4}
                filter="url(#glow)"
                style={{
                  transition: 'all 0.3s ease'
                }}
              />
            );
          })}
      </svg>

      {/* Center Hub */}
      <div
        onClick={() => handleNodeClick('center')}
        style={{
          position: 'absolute',
          left: centerX - 90,
          top: centerY - 90,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'url(#centerGradient)',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
          boxShadow: hoveredNode === 'center' 
            ? '0 0 60px rgba(139, 92, 246, 0.8), 0 0 100px rgba(59, 130, 246, 0.4)'
            : '0 0 40px rgba(139, 92, 246, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          transform: hoveredNode === 'center' ? 'scale(1.05)' : 'scale(1)',
          animation: 'pulse 3s ease-in-out infinite',
          border: '3px solid rgba(255,255,255,0.2)',
          zIndex: 10
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#fff',
          textAlign: 'center',
          lineHeight: 1.3,
          fontFamily: "'Sora', sans-serif"
        }}>
          WorkPilot<br/>AI Brain
        </div>
        <div style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.7)',
          marginTop: 4
        }}>
          Central Hub
        </div>
      </div>

      {/* Integration Nodes */}
      {nodePositions.map((node, i) => {
        const isHovered = hoveredNode === node;
        const nodeSize = 70;
        const statusColor = node.connected
          ? (node.healthStatus === 'healthy' ? '#10b981' :
             node.healthStatus === 'degraded' ? '#f59e0b' : '#ef4444')
          : '#6b7280';

        return (
          <div
            key={i}
            onClick={() => handleNodeClick(node)}
            style={{
              position: 'absolute',
              left: node.x - nodeSize / 2,
              top: node.y - nodeSize / 2,
              width: nodeSize,
              height: nodeSize,
              borderRadius: '50%',
              background: node.connected
                ? `rgba(${statusColor === '#10b981' ? '16, 185, 129' : 
                           statusColor === '#f59e0b' ? '245, 158, 11' : '239, 68, 68'}, 0.15)`
                : 'rgba(255, 255, 255, 0.05)',
              border: node.connected
                ? `2px solid ${statusColor}`
                : '2px dashed rgba(255,255,255,0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: isHovered ? 'scale(1.15)' : 'scale(1)',
              boxShadow: isHovered
                ? `0 0 30px ${statusColor}80`
                : node.connected ? `0 0 15px ${statusColor}40` : 'none',
              zIndex: isHovered ? 20 : 5,
              filter: node.connected ? 'none' : 'grayscale(70%)'
            }}
          >
            <div style={{ fontSize: 28 }}>
              {node.displayName === 'Gmail' ? '📧' :
               node.displayName === 'Google Calendar' ? '📅' :
               node.displayName === 'GitHub' ? '⭐' :
               node.displayName === 'Slack' ? '💬' :
               node.displayName === 'Notion' ? '📝' :
               node.displayName === 'Jira' ? '📋' :
               node.displayName === 'Zoom' ? '🎥' :
               node.displayName === 'Trello' ? '📌' :
               node.displayName === 'Microsoft Teams' ? '☁️' :
               node.displayName === 'Google Drive' ? '📁' :
               node.displayName === 'Outlook' ? '📨' : '🔌'}
            </div>
            
            {/* Status indicator dot */}
            {node.connected && (
              <div style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: statusColor,
                border: '2px solid #000',
                animation: node.healthStatus === 'degraded' ? 'blink 1s infinite' : 'none'
              }} />
            )}
          </div>
        );
      })}

      {/* Node labels */}
      {nodePositions.map((node, i) => (
        <div
          key={`label-${i}`}
          style={{
            position: 'absolute',
            left: node.x,
            top: node.y + 45,
            transform: 'translateX(-50%)',
            fontSize: 11,
            fontWeight: 600,
            color: node.connected ? '#fff' : 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            zIndex: 15
          }}
        >
          {node.displayName}
        </div>
      ))}

      {/* Tooltip */}
      {tooltip.show && tooltip.data && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 15,
            top: tooltip.y - 80,
            background: 'rgba(10, 10, 20, 0.95)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 12,
            color: '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            minWidth: 200,
            pointerEvents: 'none'
          }}
        >
          <div style={{ 
            fontWeight: 700, 
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: 20 }}>
              {tooltip.data.displayName === 'Gmail' ? '📧' :
               tooltip.data.displayName === 'Google Calendar' ? '📅' :
               tooltip.data.displayName === 'GitHub' ? '⭐' : '🔌'}
            </span>
            {tooltip.data.displayName}
          </div>
          
          {tooltip.data.connected ? (
            <>
              <div style={{ 
                color: tooltip.data.healthStatus === 'healthy' ? '#10b981' : '#f59e0b',
                fontSize: 11,
                marginBottom: 6
              }}>
                ● {tooltip.data.accountLabel || 'Connected'}
              </div>
              {tooltip.data.lastSyncLabel && (
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                  Last sync: {tooltip.data.lastSyncLabel}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
              {tooltip.data.available ? 'Click to connect' : 'Coming soon'}
            </div>
          )}
        </div>
      )}

      {/* Pulsing animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { 
            box-shadow: 0 0 40px rgba(139, 92, 246, 0.6);
          }
          50% { 
            box-shadow: 0 0 60px rgba(139, 92, 246, 0.8), 0 0 100px rgba(59, 130, 246, 0.4);
          }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default NetworkGraph;

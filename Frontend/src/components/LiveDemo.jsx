import React, { useState, useEffect, useRef } from 'react';

export default function LiveDemo() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am WorkPilot AI. Click any of the command chips below or type a command to see how I automate workplace tasks.',
      timestamp: 'Just now'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messageAreaRef = useRef(null);

  const commandResponses = {
    'Generate Daily Summary': 
      "**Daily Sync Summary (July 13th):**\n\n- **Dev Team:** OAuth integration complete. Blocked by API configuration.\n- **Design Team:** Finalized dark mode UI blueprints.\n- **Alerts:** 3 issues auto-created in Jira. Standup summary dispatched via Slack.",
    
    'Draft Client Reply': 
      "**AI Draft Response (Sentiment: Professional):**\n\n\"Hi Thomas, thank you for reaching out. We apologize for the delay. The credential setup issue has been resolved. Please test now.\"\n\n*Draft synced to Gmail. Ready to send.*",
    
    'Verify CI/CD Build': 
      "**CI/CD Diagnostic Report:**\n\n- **Status:** ONLINE (Healthy)\n- **Core Version:** `v2.4.2-stable`\n- **Memory Usage:** 244MB/1024MB (23%)\n- **Active Bottlenecks:** None detected.",
    
    'Query Document Vector (RAG)': 
      "**Vector Database Retrieval (RAG):**\n\nQuery matched 2 vector chunks in `sop_security.pdf` (**96.4% match**):\n- *Retrieved context:* 'All data is encrypted in transit and SOC2 logs are saved.'\n- *Synthesized Answer:* We are SOC2 and GDPR compliant."
  };

  const handleCommandClick = (cmd) => {
    if (isTyping) return;

    // 1. Add User Message
    const userMsg = { sender: 'user', text: cmd, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // 2. Simulate AI Typing response after delay
    setTimeout(() => {
      const responseText = commandResponses[cmd] || "Command not recognized. Please click one of the suggested buttons.";
      let currentLength = 0;
      
      const newAiMsg = {
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newAiMsg]);

      // Typing speed simulation
      const typingInterval = setInterval(() => {
        if (currentLength < responseText.length) {
          currentLength += Math.min(4, responseText.length - currentLength); // type chunks for speed
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              text: responseText.slice(0, currentLength)
            };
            return updated;
          });
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 20);
    }, 800);
  };

  // Scroll to bottom of message container on updates
  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <section id="demo" className="section-padding reveal-on-scroll" style={{ background: '#000000', borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}>
      <div className="container">
        <div className="section-header">
          <div style={{
            color: 'var(--blue)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '0.75rem'
          }}>
            Live Workspace
          </div>
          <h2>Interact with WorkPilot</h2>
          <p>Click the pre-configured command chips below to simulate autonomous workplace operations.</p>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Terminal/Chat Window */}
          <div className="glass-card" style={{
            background: 'rgba(5, 5, 5, 0.85)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {/* Mac Titlebar */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></span>
              </div>
              <div style={{
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-code)'
              }}>
                agent-session: workpilot-terminal
              </div>
              <div style={{ width: '42px' }}></div> {/* spacer */}
            </div>

            {/* Message Area */}
            <div 
              ref={messageAreaRef}
              style={{
                height: '350px',
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                scrollBehavior: 'smooth'
              }}
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.3s ease forwards'
                  }}
                >
                  <div style={{
                    background: msg.sender === 'user' ? 'linear-gradient(135deg, var(--blue), var(--indigo))' : 'rgba(255, 255, 255, 0.04)',
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#ffffff',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    whiteSpace: 'pre-wrap',
                    fontFamily: msg.sender === 'user' ? 'var(--font-body)' : 'var(--font-code)'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem'
                  }}>
                    {msg.timestamp}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '4px', padding: '0.75rem 1.25rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px' }}>
                  <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--blue)', borderRadius: '50%', animation: 'bounceDot 1.4s infinite' }}></span>
                  <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--blue)', borderRadius: '50%', animation: 'bounceDot 1.4s infinite 0.2s' }}></span>
                  <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--blue)', borderRadius: '50%', animation: 'bounceDot 1.4s infinite 0.4s' }}></span>
                </div>
              )}
            </div>

            {/* Action Chips */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              background: 'rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                marginBottom: '0.75rem',
                fontWeight: 500
              }}>
                SUGGESTED WORKFLOW ACTIONS:
              </div>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                {Object.keys(commandResponses).map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCommandClick(cmd)}
                    disabled={isTyping}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '20px',
                      padding: '0.4rem 0.9rem',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: '0.8rem',
                      cursor: isTyping ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                      transition: 'all 0.2s ease'
                    }}
                    className="chip-btn"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceDot {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .chip-btn:hover:not(:disabled) {
          border-color: var(--blue) !important;
          color: #ffffff !important;
          background: rgba(59, 130, 246, 0.1) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </section>
  );
}

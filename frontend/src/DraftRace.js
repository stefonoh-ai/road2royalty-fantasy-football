import React, { useState, useEffect } from 'react';
import './DraftRace.css';

const DraftRace = () => {
  const [draftOrder, setDraftOrder] = useState([]);
  const [isRacing, setIsRacing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [raceStatus, setRaceStatus] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // Check race status and handle countdown
  useEffect(() => {
    checkRaceStatus();
    
    // Set up interval to update countdown and check for auto-start
    const interval = setInterval(() => {
      checkRaceStatus();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle auto-start when time is reached
  useEffect(() => {
    if (raceStatus && raceStatus.should_auto_start && !hasAutoStarted && !isRacing) {
      setHasAutoStarted(true);
      startRace();
    }
  }, [raceStatus, hasAutoStarted, isRacing]);

  const checkRaceStatus = async () => {
    try {
      const response = await fetch('http://192.168.86.64:8000/draft-race-status');
      const status = await response.json();
      setRaceStatus(status);
      setTimeRemaining(status.time_until_reveal || 0);
      
      // If draft is completed, fetch and show the final order
      if (status.draft_completed && !showResults) {
        const orderResponse = await fetch('http://192.168.86.64:8000/draft-order');
        const orderData = await orderResponse.json();
        if (!orderData.error) {
          setDraftOrder(orderData);
          setShowResults(true);
        }
      }
    } catch (error) {
      console.error('Error checking race status:', error);
    }
  };



  const startRace = async () => {
    // Don't start if time locked or draft completed
    if (raceStatus && (raceStatus.time_locked || raceStatus.draft_completed)) {
      return;
    }
    
    setIsRacing(true);
    setShowResults(false);
    setDraftOrder([]);

    try {
      const response = await fetch('http://192.168.86.64:8000/draft-order');
      const newOrder = await response.json();
      if (newOrder.error) {
        console.error('Draft order not available:', newOrder.error);
        setIsRacing(false);
        return;
      }
      
      // Simulate race animation for 4 seconds
      setTimeout(() => {
        setDraftOrder(newOrder);
        setIsRacing(false);
        setShowResults(true);
        // Update race status to mark draft as completed
        checkRaceStatus();
      }, 4000);
    } catch (error) {
      console.error('Error fetching draft order:', error);
      setIsRacing(false);
    }
  };
  
  const formatTimeRemaining = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getHelmetClass = (nflTeam, helmetStyle) => {
    return `helmet ${nflTeam.toLowerCase()}-${helmetStyle}`;
  };

  // Don't render anything if race status hasn't loaded yet
  if (!raceStatus) {
    return <div className="draft-race-container">Loading...</div>;
  }

  return (
    <div className="draft-race-container">
      <h2>Draft Order Race</h2>
      
      {/* Time Lock / Race Status */}
      {raceStatus.time_locked ? (
        <div className="race-locked">
          <h3>⏰ Draft Order Countdown</h3>
          <p>The draft order will be revealed on:</p>
          <div className="reveal-time">
            <strong>August 3rd, 2025 at 12:00 PM Pacific</strong>
          </div>
          <div className="countdown-timer">
            <div className="countdown-display">
              <span className="countdown-label">Time Remaining:</span>
              <span className="countdown-value">{formatTimeRemaining(timeRemaining)}</span>
            </div>
          </div>
          <p className="countdown-note">
            🎯 The race will start automatically when the timer reaches zero!
          </p>
        </div>
      ) : raceStatus.draft_completed ? (
        <div className="race-completed">
          <h3>✅ Draft Order Finalized</h3>
          <p>The draft order has been determined and is now locked in!</p>
        </div>
      ) : (
        <>
          <div className="race-ready">
            <h3>🚀 Draft Order Ready!</h3>
            <p>Time's up! {hasAutoStarted ? 'The race has started automatically!' : 'Click to start the race manually.'}</p>
          </div>
          
          {!hasAutoStarted && (
            <button 
              className="race-button" 
              onClick={startRace} 
              disabled={isRacing}
            >
              {isRacing ? 'Racing...' : 'Start Draft Order Race!'}
            </button>
          )}
        </>
      )}

      {isRacing && (
        <div className="football-field">
          <div className="field-lines">
            {[...Array(11)].map((_, i) => (
              <div key={i} className="yard-line" style={{left: `${i * 9}%`}}>
                <span className="yard-number">{i * 10}</span>
              </div>
            ))}
          </div>
          
          <div className="racing-helmets">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className={`racing-helmet helmet-${i + 1}`}
                style={{
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${3.5 + Math.random() * 1}s`
                }}
              >
                🏈
              </div>
            ))}
          </div>
        </div>
      )}

      {(showResults || raceStatus?.draft_completed) && draftOrder.length > 0 && (
        <div className="race-results">
          <h3>🏆 Final Draft Order {raceStatus?.draft_completed ? '(LOCKED)' : ''}</h3>
          <div className="results-grid">
            {draftOrder.map((pick, index) => (
              <div key={index} className="result-card">
                <div className="draft-position">#{pick.draft_position}</div>
                <div className="helmet-icon">
                  🏈
                </div>
                <div className="owner-name">{pick.owner}</div>
              </div>
            ))}
          </div>
          {raceStatus?.draft_completed && (
            <div className="locked-notice">
              <p>🔒 This draft order is now permanent and cannot be changed.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DraftRace;

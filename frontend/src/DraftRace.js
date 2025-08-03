import React, { useState, useEffect } from 'react';
import './DraftRace.css';

const DraftRace = () => {
  const [draftOrder, setDraftOrder] = useState([]);
  const [isRacing, setIsRacing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [raceStatus, setRaceStatus] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [raceProgress, setRaceProgress] = useState(0);
  const [raceTimeLeft, setRaceTimeLeft] = useState(0);
  const [helmetPositions, setHelmetPositions] = useState([]);

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
      const response = await fetch('https://road2royalty-backend.onrender.com/draft-race-status');
      const status = await response.json();
      
      // Use the backend's real countdown logic
      // Backend handles the August 3rd, 2025 noon countdown
      
      setRaceStatus(status);
      setTimeRemaining(status.time_until_reveal || 0);
      
      // If draft is completed, fetch and show the final order
      if (status.draft_completed && !showResults) {
        const orderResponse = await fetch('https://road2royalty-backend.onrender.com/draft-order');
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
    setRaceProgress(0);
    setRaceTimeLeft(30);
    
    // Initialize player positions with dynamic racing variations and owner initials
    const jerseyColors = [
      '#FF0000', '#0000FF', '#008000', '#FFA500', '#800080',
      '#FFD700', '#FF69B4', '#00FFFF', '#32CD32', '#DC143C'
    ];
    const ownerInitials = [
      'SH', 'JP', 'AJ', 'MD', 'CW', 'RM', 'TB', 'JL', 'ST', 'ZM'
    ]; // Stefono, Jake, Alex, Mike, Chris, Ryan, Tyler, Jordan, Sam, Zeke
    
    const initialPositions = Array.from({length: 10}, (_, i) => ({
      baseOffset: (Math.random() - 0.5) * 15, // Wider initial variation
      verticalPosition: 30 + (i * 12), // More spacing between players
      jerseyColor: jerseyColors[i],
      ownerInitials: ownerInitials[i],
      speed: 0.8 + (Math.random() * 0.4), // Random speed multiplier (0.8 to 1.2)
      lastPositionUpdate: 0
    }));
    setHelmetPositions(initialPositions);

    try {
      const response = await fetch('https://road2royalty-backend.onrender.com/draft-order');
      const newOrder = await response.json();
      
      // LOCAL TESTING: If backend says not available, generate mock order
      let finalOrder = newOrder;
      if (newOrder.error) {
        console.log('Backend not ready, generating local test order...');
        const owners = [
          "Stefono Hanks", "Jake Pridmore", "Alex Johnson", "Mike Davis", "Chris Wilson",
          "Ryan Martinez", "Tyler Brown", "Jordan Lee", "Sam Taylor", "Zeke Martinez"
        ];
        const shuffled = [...owners].sort(() => Math.random() - 0.5);
        finalOrder = shuffled.map((owner, index) => ({
          position: index + 1,
          owner: owner
        }));
      }
      
      // Start progress tracking during race
      const raceStartTime = Date.now();
      const raceDuration = 30000; // 30 seconds
      
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - raceStartTime;
        const progress = Math.min((elapsed / raceDuration) * 100, 100);
        const timeLeft = Math.max(30 - Math.floor(elapsed / 1000), 0);
        
        setRaceProgress(progress);
        setRaceTimeLeft(timeLeft);
        
        // Update player positions dynamically every 2 seconds
        if (elapsed % 2000 < 100) {
          setHelmetPositions(prevPositions => 
            prevPositions.map(player => ({
              ...player,
              baseOffset: player.baseOffset + (Math.random() - 0.5) * 8, // Random position change
              speed: Math.max(0.6, Math.min(1.4, player.speed + (Math.random() - 0.5) * 0.3)) // Speed variation
            }))
          );
        }
        
        if (elapsed >= raceDuration) {
          clearInterval(progressInterval);
        }
      }, 100); // Update every 100ms for smooth progress
      
      // Simulate race animation for 30 seconds
      setTimeout(() => {
        clearInterval(progressInterval);
        setDraftOrder(finalOrder);
        setIsRacing(false);
        setShowResults(true);
        setRaceProgress(100);
        setRaceTimeLeft(0);
        // Update race status to mark draft as completed
        checkRaceStatus();
      }, 30000);
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
        <div className="race-in-progress">
          <div className="race-status">
            <h3>🏁 DRAFT ORDER RACE IN PROGRESS! 🏁</h3>
            <div className="race-timer">
              <span className="timer-label">Race Time Remaining:</span>
              <span className="timer-value">{raceTimeLeft}s</span>
            </div>
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{width: `${raceProgress}%`}}
                ></div>
              </div>
              <div className="progress-text">{Math.round(raceProgress)}% Complete</div>
            </div>
          </div>
          
          <div className="football-field">
            <div className="field-lines">
              {[...Array(11)].map((_, i) => (
                <div key={i} className="yard-line" style={{left: `${i * 9}%`}}>
                  <span className="yard-number">{i * 10}</span>
                </div>
              ))}
            </div>
            
            <div className="racing-players">
              {helmetPositions.map((player, i) => {
                // Each player moves with dynamic speed and position variations
                const baseProgress = raceProgress * player.speed;
                const playerProgress = Math.min(100, Math.max(0, baseProgress + player.baseOffset));
                
                return (
                  <div 
                    key={i} 
                    className={`racing-player player-${i + 1}`}
                    style={{
                      position: 'absolute',
                      left: `${playerProgress}%`,
                      top: `${player.verticalPosition}px`,
                      transition: 'left 0.8s ease-out', // Smoother transitions for position changes
                      transform: 'translateX(-50%)',
                      fontSize: '24px',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <div 
                      className="player-jersey"
                      style={{
                        backgroundColor: player.jerseyColor,
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: 'bold',
                        color: 'white',
                        textShadow: '1px 1px 1px rgba(0,0,0,0.8)'
                      }}
                    >
                      {player.ownerInitials}
                    </div>
                    <span 
                      className="football-player"
                      style={{
                        animation: 'running 0.6s infinite alternate',
                        fontSize: '20px'
                      }}
                    >
                      🏈
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="race-excitement">
              <div className="excitement-text">🔥 THE RACE IS ON! 🔥</div>
              <div className="excitement-subtext">Who will get the #1 draft pick?!</div>
            </div>
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

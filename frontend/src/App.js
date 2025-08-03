import React, { useState, useEffect } from 'react';
import './App.css';
import DraftRace from './DraftRace';
import { fetchJSON, wakeUpBackend, fetchWithRetry } from './apiUtils';

function App() {
  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  const [payment, setPayment] = useState(null);
  const [draft, setDraft] = useState(null);
  const [draftOrder, setDraftOrder] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showCommissionerPanel, setShowCommissionerPanel] = useState(false);
  const [commissionerAuthenticated, setCommissionerAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [swapInterested, setSwapInterested] = useState(() => {
    // Initialize immediately with localStorage to prevent loading state
    try {
      const saved = localStorage.getItem('road2royalty-swap-interest');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading initial swap interest state:', error);
      return {};
    }
  });
  const [showSwapValidation, setShowSwapValidation] = useState(false);
  const [swapValidationData, setSwapValidationData] = useState({ teamIndex: null, teamOwner: '' });
  const [lastNameInput, setLastNameInput] = useState('');

  // Commissioner PIN - you can change this to whatever you want
  const COMMISSIONER_PIN = '9574';

  useEffect(() => {
    // Wake up backend and fetch all data when component mounts
    const initializeApp = async () => {
      console.log('🚀 Initializing Road 2 Royalty app...');
      await wakeUpBackend(); // Proactively wake up backend
      fetchLeagueInfo();
      fetchTeams();
      fetchPaymentInfo();
      fetchDraftInfo();
      fetchDraftOrder();
      fetchSwapInterest();
    };

    initializeApp();
  }, []);

  const fetchLeagueInfo = async () => {
    try {
      const data = await fetchJSON('/league');
      setLeague(data);
    } catch (error) {
      console.error('Error fetching league info:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const data = await fetchJSON('/teams');
      const teams = data.teams || [];
      
      // Check if we have local payment data that's different from backend
      const localPaymentData = localStorage.getItem('road2royalty-payment-status');
      if (localPaymentData) {
        const localPayments = JSON.parse(localPaymentData);
        // Merge local payment status with backend data
        teams.forEach((team) => {
          if (localPayments[team.owner] !== undefined) {
            team.paid = localPayments[team.owner];
          }
        });
        console.log('📱 Merged local payment data with backend');
      }
      
      setTeams(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchPaymentInfo = async () => {
    try {
      const data = await fetchJSON('/payment');
      setPayment(data);
    } catch (error) {
      console.error('Error fetching payment info:', error);
    }
  };

  const fetchDraftInfo = async () => {
    try {
      const data = await fetchJSON('/draft');
      setDraft(data);
    } catch (error) {
      console.error('Error fetching draft info:', error);
    }
  };

  const fetchDraftOrder = async () => {
    try {
      // TEMPORARY: Use official draft order while backend updates
      const officialDraftOrder = [
        {"draft_position": 1, "owner": "Sal Guerra"},
        {"draft_position": 2, "owner": "Anthony Hanks"},
        {"draft_position": 3, "owner": "Bo Alvarez"},
        {"draft_position": 4, "owner": "Stefono Hanks"},
        {"draft_position": 5, "owner": "Jordan Pensa"},
        {"draft_position": 6, "owner": "Emiliano Hanks"},
        {"draft_position": 7, "owner": "Aaron Bell"},
        {"draft_position": 8, "owner": "Jake Pridmore"},
        {"draft_position": 9, "owner": "Mike Hanks"},
        {"draft_position": 10, "owner": "Zeke Martinez"}
      ];
      
      console.log('🏈 Using official draft order from actual draft results');
      setDraftOrder(officialDraftOrder);
      
      // Also try to fetch from backend for future updates
      try {
        const data = await fetchJSON('/draft-order');
        // Only use backend data if it matches our official order
        if (data && data.length === 10 && data[0].owner === "Sal Guerra") {
          console.log('✅ Backend updated with correct draft order');
          setDraftOrder(data);
        }
      } catch (backendError) {
        console.log('⚠️ Backend not ready, using official order');
      }
    } catch (error) {
      console.error('Error with draft order:', error);
    }
  };

  // Helper function to get draft position for a team owner
  const getDraftPosition = (ownerName) => {
    const draftPick = draftOrder.find(pick => pick.owner === ownerName);
    return draftPick ? draftPick.draft_position : null;
  };

  const updateTeam = async (teamIndex, updatedData) => {
    try {
      const response = await fetchWithRetry(`/admin/update-team/${teamIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      const result = await response.json();

      if (result.team) {
        // Update local state immediately
        const updatedTeams = [...teams];
        updatedTeams[teamIndex] = result.team;
        setTeams(updatedTeams);
        setEditingTeam(null);
        console.log('✅ Team updated successfully:', result.team);
      }
    } catch (error) {
      console.error('❌ Error updating team:', error);
    }
  };

  const handleTogglePayment = async (teamIndex) => {
    const currentTeam = teams[teamIndex];
    const updatedPaymentStatus = !currentTeam.paid;
    
    // Update local state immediately for responsive UI
    const updatedTeams = [...teams];
    updatedTeams[teamIndex] = { ...currentTeam, paid: updatedPaymentStatus };
    setTeams(updatedTeams);
    
    // Save to localStorage immediately for persistence across backend resets
    try {
      const paymentData = JSON.parse(localStorage.getItem('road2royalty-payment-status') || '{}');
      paymentData[currentTeam.owner] = updatedPaymentStatus;
      localStorage.setItem('road2royalty-payment-status', JSON.stringify(paymentData));
      console.log(`💾 Payment status saved locally for ${currentTeam.owner}: ${updatedPaymentStatus}`);
    } catch (localError) {
      console.error('Error saving payment status locally:', localError);
    }
    
    // Send update to backend (but don't revert if it fails since we have localStorage backup)
    try {
      const response = await fetchWithRetry(`/admin/update-team/${teamIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paid: updatedPaymentStatus }),
      });
      const result = await response.json();
      
      if (result.team) {
        // Confirm the update with backend response
        updatedTeams[teamIndex] = result.team;
        setTeams(updatedTeams);
        console.log('✅ Payment status updated:', result.team);
      } else {
        // Revert on failure
        updatedTeams[teamIndex] = currentTeam;
        setTeams(updatedTeams);
        console.error('❌ Failed to update payment status');
      }
    } catch (error) {
      // Revert on error
      updatedTeams[teamIndex] = currentTeam;
      setTeams(updatedTeams);
      console.error('❌ Error updating payment status:', error);
    }
  };

  const handleEditTeam = (index, field, value) => {
    const updatedData = { [field]: value };
    updateTeam(index, updatedData);
  };

  const handleCommissionerAccess = () => {
    if (commissionerAuthenticated) {
      setShowCommissionerPanel(!showCommissionerPanel);
    } else {
      setShowPinPrompt(true);
      setPinInput('');
    }
  };

  const handlePinSubmit = () => {
    if (pinInput === COMMISSIONER_PIN) {
      setCommissionerAuthenticated(true);
      setShowCommissionerPanel(true);
      setShowPinPrompt(false);
      setPinInput('');
    } else {
      alert('Incorrect PIN. Access denied.');
      setPinInput('');
    }
  };

  const handlePinCancel = () => {
    setShowPinPrompt(false);
    setPinInput('');
  };

  const handleSwapInterestToggle = (teamIndex) => {
    const teamOwner = teams[teamIndex]?.owner;
    if (!teamOwner) return;

    // Show custom validation modal
    setSwapValidationData({ teamIndex, teamOwner });
    setShowSwapValidation(true);
    setLastNameInput('');
  };

  const fetchSwapInterest = async () => {
    try {
      const data = await fetchJSON('/swap-interest');
      // Only update if backend data is different from localStorage
      const currentData = JSON.stringify(swapInterested);
      const backendData = JSON.stringify(data);
      if (currentData !== backendData) {
        setSwapInterested(data);
        // Sync localStorage with backend
        localStorage.setItem('road2royalty-swap-interest', backendData);
        console.log('✅ Swap interest synced from backend:', data);
      }
    } catch (error) {
      console.log('📱 Backend swap interest not available, keeping localStorage data');
      // Don't need to do anything - already initialized with localStorage
    }
  };

  const handleSwapValidationSubmit = async () => {
    const { teamIndex, teamOwner } = swapValidationData;
    
    // Extract last name from full name for validation
    const ownerLastName = teamOwner.split(' ').pop().toLowerCase();
    
    // Validate last name (case insensitive)
    if (lastNameInput.toLowerCase().trim() !== ownerLastName) {
      alert('❌ Incorrect last name. Access denied.');
      return;
    }

    const newInterestState = !swapInterested[teamOwner];
    
    try {
      // Update backend
      const response = await fetchWithRetry('/swap-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: teamOwner,
          interested: newInterestState
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update swap interest');
      }
      
      // Update local state
      const newSwapState = {
        ...swapInterested,
        [teamOwner]: newInterestState
      };
      setSwapInterested(newSwapState);
      
      // Also save to localStorage as backup
      try {
        localStorage.setItem('road2royalty-swap-interest', JSON.stringify(newSwapState));
      } catch (localError) {
        console.error('Error saving to localStorage:', localError);
      }
      
      console.log(`💾 Swap interest ${newInterestState ? 'enabled' : 'disabled'} for ${teamOwner}`);
      
      // Success message
      const action = newInterestState ? 'enabled' : 'disabled';
      alert(`✅ Swap interest ${action} for ${teamOwner}`);
    } catch (error) {
      console.error('Error saving swap interest state:', error);
      // Fallback to localStorage if backend fails
      try {
        const newSwapState = {
          ...swapInterested,
          [teamOwner]: newInterestState
        };
        setSwapInterested(newSwapState);
        localStorage.setItem('road2royalty-swap-interest', JSON.stringify(newSwapState));
        
        const action = newInterestState ? 'enabled' : 'disabled';
        alert(`⚠️ Backend unavailable. Swap interest ${action} locally (will sync when backend is available)`);
      } catch (localError) {
        alert('❌ Error saving swap interest. Please try again.');
      }
    }
    
    // Close modal
    setShowSwapValidation(false);
    setLastNameInput('');
  };

  const handleSwapValidationCancel = () => {
    setShowSwapValidation(false);
    setLastNameInput('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="league-logo">
          <img 
            src="/road2royalty-logo.png" 
            alt="Road 2 Royalty Logo" 
            className="logo-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div 
            className="crown-icon" 
            style={{display: 'none'}}
            onClick={handleCommissionerAccess}
            title="Click for Commissioner Access"
          >
            👑
          </div>
        </div>
        
        <div className="league-title-container">
          <h1>{league ? league.name : 'Loading...'}</h1>
          <p className="league-tagline">Where Legends Battle. One Road. One Crown.</p>
        </div>
      </header>

      <main className="App-main">
        
        {/* Tab Navigation - Moved up before league highlights */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'main' ? 'active' : ''}`}
            onClick={() => setActiveTab('main')}
          >
            🏠 League Home
          </button>
          <button 
            className={`tab-button ${activeTab === 'draft-race' ? 'active' : ''}`}
            onClick={() => setActiveTab('draft-race')}
          >
            🏁 Draft Race
          </button>
          <button 
            className={`tab-button ${activeTab === 'draft-info' ? 'active' : ''}`}
            onClick={() => setActiveTab('draft-info')}
          >
            📋 Draft Info
          </button>
        </div>

        {league && (
          <div className="league-highlights">
            <div className="highlight-item buy-in">
              <span className="highlight-label">Buy-in:</span>
              <span className="highlight-value">${league.buy_in}</span>
              <span className="highlight-note">({league.draft_deadline})</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-label">1st Place:</span>
              <span className="highlight-value">${league.prizes.first_place}</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-label">2nd Place:</span>
              <span className="highlight-value">${league.prizes.second_place}</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-label">3rd Place:</span>
              <span className="highlight-value">${league.prizes.third_place}</span>
            </div>
            <div className="highlight-item championship">
              <span className="highlight-label">Champion Gets:</span>
              <span className="highlight-value">{league.championship_prize}</span>
            </div>
          </div>
        )}



        {/* Commissioner Panel */}
        {showCommissionerPanel && (
          <div className="commissioner-panel">
            <div className="commissioner-header">
              <h3>
                🛡️ Commissioner Panel 
                {commissionerAuthenticated && <span className="auth-indicator">🔓</span>}
              </h3>
              <button 
                onClick={() => setShowCommissionerPanel(false)}
                className="close-panel-btn"
              >
                ✕
              </button>
            </div>
            {!commissionerAuthenticated && (
              <div className="auth-required">
                <p>🔐 Authentication required to access commissioner features.</p>
                <button 
                  onClick={() => setShowPinPrompt(true)}
                  className="auth-btn"
                >
                  Enter PIN
                </button>
              </div>
            )}
          </div>
        )}

        {/* PIN Prompt Modal */}
        {showPinPrompt && (
          <div className="pin-modal-overlay">
            <div className="pin-modal">
              <h3>🔐 Commissioner Access</h3>
              <p>Enter PIN to access commissioner features:</p>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePinSubmit();
                  } else if (e.key === 'Escape') {
                    handlePinCancel();
                  }
                }}
                placeholder="Enter PIN"
                className="pin-input"
                autoFocus
                maxLength="10"
              />
              <div className="pin-buttons">
                <button onClick={handlePinSubmit} className="pin-submit-btn">
                  Submit
                </button>
                <button onClick={handlePinCancel} className="pin-cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Swap Interest Validation Modal */}
        {showSwapValidation && (
          <div className="pin-modal-overlay">
            <div className="pin-modal swap-validation-modal">
              <h3>🔐 Verification Required</h3>
              <p>To toggle swap interest for <strong>{swapValidationData.teamOwner}</strong>, please enter their last name:</p>
              <input
                type="text"
                value={lastNameInput}
                onChange={(e) => setLastNameInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSwapValidationSubmit();
                  } else if (e.key === 'Escape') {
                    handleSwapValidationCancel();
                  }
                }}
                placeholder="Enter last name"
                className="pin-input"
                autoFocus
              />
              <div className="pin-buttons">
                <button onClick={handleSwapValidationSubmit} className="pin-submit-btn">
                  ✅ Verify
                </button>
                <button onClick={handleSwapValidationCancel} className="pin-cancel-btn">
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Tab Content */}
        {activeTab === 'main' && (
          <div className="tab-content">
            {/* Teams Section */}
            <section className="teams-section">
              <h2>👥 League Members</h2>
              <div className="teams-grid">
                {teams.map((team, index) => {
                  const draftPosition = getDraftPosition(team.owner);
                  const isSwapInterested = swapInterested[team.owner] || false;
                  return (
                    <div key={index} className={`team-card ${isSwapInterested ? 'swap-interested' : ''}`}>
                      {draftPosition && (
                        <div className="draft-position-badge">
                          <span className="draft-number">#{draftPosition}</span>
                          <span className="draft-label">Draft Pick</span>
                        </div>
                      )}
                      <h3>
                        {showCommissionerPanel && commissionerAuthenticated && editingTeam === index ? (
                          <input
                            type="text"
                            defaultValue={team.team_name}
                            onBlur={(e) => handleEditTeam(index, 'team_name', e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleEditTeam(index, 'team_name', e.target.value);
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span 
                            onClick={() => showCommissionerPanel && commissionerAuthenticated && setEditingTeam(index)}
                            style={{cursor: showCommissionerPanel && commissionerAuthenticated ? 'pointer' : 'default'}}
                          >
                            {team.team_name}
                          </span>
                        )}
                      </h3>
                      <p>
                        <strong>Owner:</strong> 
                        {showCommissionerPanel && commissionerAuthenticated && editingTeam === index ? (
                          <input
                            type="text"
                            defaultValue={team.owner}
                            onBlur={(e) => handleEditTeam(index, 'owner', e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleEditTeam(index, 'owner', e.target.value);
                              }
                            }}
                          />
                        ) : (
                          <span 
                            onClick={() => showCommissionerPanel && commissionerAuthenticated && setEditingTeam(index)}
                            style={{cursor: showCommissionerPanel && commissionerAuthenticated ? 'pointer' : 'default'}}
                          >
                            {team.owner}
                          </span>
                        )}
                      </p>
                      <p><strong>Role:</strong> {team.role}</p>
                      <div className="payment-status">
                        <strong>Payment Status:</strong>
                        <span className={`status ${team.paid ? 'paid' : 'unpaid'}`}>
                          {team.paid ? '✅ Paid' : '❌ Unpaid'}
                        </span>
                        {showCommissionerPanel && commissionerAuthenticated && (
                          <button 
                            onClick={() => handleTogglePayment(index)}
                            className="toggle-payment-btn"
                          >
                            Toggle
                          </button>
                        )}
                      </div>
                      
                      {/* Draft Order Swap Interest */}
                      <div className="swap-interest-section">
                        <button 
                          onClick={() => handleSwapInterestToggle(index)}
                          className={`swap-interest-btn ${isSwapInterested ? 'interested' : ''}`}
                        >
                          {isSwapInterested ? '🔄 Remove Swap Interest' : '🔄 Interested in Swapping'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Payment Section - Styled like league highlights */}
            {payment && (
              <section className="payment-section">
                <h2>💰 Payment Information</h2>
                <div className="league-highlights payment-highlights">
                  <div className="highlight-item">
                    <span className="highlight-label">Commissioner:</span>
                    <span className="highlight-value">{payment.commissioner}</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">📱 Venmo:</span>
                    <span className="highlight-value">{payment.venmo}</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">🍎 Apple Pay:</span>
                    <span className="highlight-value">{payment.apple_pay}</span>
                  </div>
                  <div className="highlight-item payment-note">
                    <span className="highlight-label">Instructions:</span>
                    <span className="highlight-value">{payment.instructions}</span>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'draft-race' && (
          <div className="tab-content">
            <DraftRace />
          </div>
        )}

        {activeTab === 'draft-info' && (
          <div className="tab-content">
            {/* Draft Section */}
            {draft && (
              <section className="draft-section">
                <h2>🏈 Live Draft Information</h2>
                <div className="draft-info-grid">
                  <div className="draft-info-card">
                    <div className="draft-info-icon">📅</div>
                    <div className="draft-info-content">
                      <span className="draft-info-label">Date</span>
                      <span className="draft-info-value">{draft.date}</span>
                    </div>
                  </div>
                  <div className="draft-info-card">
                    <div className="draft-info-icon">⏰</div>
                    <div className="draft-info-content">
                      <span className="draft-info-label">Time</span>
                      <span className="draft-info-value">{draft.time}</span>
                    </div>
                  </div>
                  <div className="draft-info-card">
                    <div className="draft-info-icon">📍</div>
                    <div className="draft-info-content">
                      <span className="draft-info-label">Location</span>
                      <span className="draft-info-value">{draft.location}</span>
                    </div>
                  </div>
                  <div className="draft-info-card">
                    <div className="draft-info-icon">🍕</div>
                    <div className="draft-info-content">
                      <span className="draft-info-label">Food & Drinks</span>
                      <span className="draft-info-value">{draft.food}</span>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

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
      setTeams(data.teams || []);
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
      const data = await fetchJSON('/draft-order');
      setDraftOrder(data);
    } catch (error) {
      console.error('Error fetching draft order:', error);
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
    
    // Send update to backend
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
          <div className="league-title-container">
            <h1>{league ? league.name : 'Loading...'}</h1>
          </div>
        </div>
        <p>{league ? league.description : 'Loading league info...'}</p>
        
        {league && (
          <div className="league-highlights">
            <div className="highlight-item">
              <span className="highlight-label">Buy-in:</span>
              <span className="highlight-value">${league.buy_in}</span>
              <span className="highlight-note">({league.draft_deadline})</span>
            </div>
            <div className="prizes-section">
              <h3>🏆 Prize Structure</h3>
              <div className="prizes-grid">
                <div className="prize-item first-place">
                  <span className="prize-position">1st Place</span>
                  <span className="prize-amount">${league.prizes.first_place}</span>
                </div>
                <div className="prize-item second-place">
                  <span className="prize-position">2nd Place</span>
                  <span className="prize-amount">${league.prizes.second_place}</span>
                </div>
                <div className="prize-item third-place">
                  <span className="prize-position">3rd Place</span>
                  <span className="prize-amount">${league.prizes.third_place}</span>
                </div>
              </div>
              <div className="championship-belt">
                <span className="belt-icon">🥇</span>
                <span className="belt-text">Winner gets the {league.championship_prize}!</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="App-main">
        {/* Hidden Commissioner Panel - Access via crown logo */}
        {showCommissionerPanel && commissionerAuthenticated && (
          <section className="commissioner-section">
            <div className="commissioner-status">
              <span className="commissioner-indicator">👑 Commissioner Mode Active</span>
              <button 
                className="commissioner-exit-btn"
                onClick={() => setShowCommissionerPanel(false)}
              >
                Exit
              </button>
            </div>
          </section>
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

        {/* Draft Order Race */}
        <DraftRace />

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
            </div>
            <div className="draft-special-note">
              <div className="draft-note-icon">🍕</div>
              <div className="draft-note-content">
                <p><strong>{draft.note}</strong></p>
                <p>{draft.details}</p>
              </div>
            </div>
          </section>
        )}

        {/* Teams Section */}
        <section className="teams-section">
          <h2>👥 League Members</h2>
          <div className="teams-grid">
            {teams.map((team, index) => {
              const draftPosition = getDraftPosition(team.owner);
              return (
                <div key={index} className="team-card">
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
              </div>
              );
            })}
          </div>
        </section>

        {/* Payment Section */}
        <section className="payment-section">
          <h2>💰 League Dues</h2>
          {payment && (
            <div className="payment-info">
              <p><strong>Commissioner:</strong> {payment.commissioner}</p>
              <p><strong>Venmo:</strong> {payment.venmo}</p>
              <p><strong>Apple Pay:</strong> {payment.apple_pay}</p>
              <p>{payment.instructions}</p>
            </div>
          )}
        </section>


      </main>
    </div>
  );
}


export default App;

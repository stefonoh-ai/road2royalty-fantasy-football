import React, { useEffect, useState } from 'react';
import './App.css';
import DraftRace from './DraftRace';

function App() {
  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  const [payment, setPayment] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showCommissionerPanel, setShowCommissionerPanel] = useState(false);
  const [commissionerAuthenticated, setCommissionerAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  
  // Commissioner PIN - you can change this to whatever you want
  const COMMISSIONER_PIN = '9574';

  useEffect(() => {
    // Fetch league info
    fetch('http://192.168.86.64:8000/league')
      .then(res => res.json())
      .then(data => setLeague(data));

    // Fetch teams
    fetch('http://192.168.86.64:8000/teams')
      .then(res => res.json())
      .then(data => setTeams(data.teams || data));

    // Fetch payment info
    fetch('http://192.168.86.64:8000/payment')
      .then(res => res.json())
      .then(data => setPayment(data));

    // Fetch draft info
    fetch('http://192.168.86.64:8000/draft')
      .then(res => res.json())
      .then(data => setDraft(data));
  }, []);

  const updateTeam = async (teamIndex, updatedData) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/admin/update-team/${teamIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      const result = await response.json();
      
      if (result.team) {
        // Update local state
        const updatedTeams = [...teams];
        updatedTeams[teamIndex] = result.team;
        setTeams(updatedTeams);
        setEditingTeam(null);
      }
    } catch (error) {
      console.error('Error updating team:', error);
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
            {teams.map((team, index) => (
              <div key={index} className="team-card">
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
                <p className={`payment-status ${team.paid ? 'paid' : 'unpaid'}`}>
                  <strong>Payment Status:</strong>
                  {showCommissionerPanel && commissionerAuthenticated ? (
                    <button
                      onClick={() => handleEditTeam(index, 'paid', !team.paid)}
                      className={`payment-toggle ${team.paid ? 'paid' : 'unpaid'}`}
                    >
                      {team.paid ? '✅ Paid' : '❌ Not Paid'}
                    </button>
                  ) : (
                    <span>{team.paid ? ' ✅ Paid' : ' ❌ Not Paid'}</span>
                  )}
                </p>
              </div>
            ))}
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

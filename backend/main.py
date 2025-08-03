from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pytz
import random
import json
import os

app = FastAPI()

# Allow frontend dev server to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Road 2 Royalty Fantasy Football League API!"}

@app.get("/league")
def get_league_info():
    return {
        "name": "Road 2 Royalty",
        "description": "Where Legends Battle. One Road. One Crown.",
        "buy_in": 200,
        "prizes": {
            "first_place": 1200,
            "second_place": 600,
            "third_place": 200
        },
        "championship_prize": "Championship Belt",
        "draft_deadline": "Buy-in due by the draft"
    }

@app.get("/teams")
def get_teams():
    return {
        "teams": teams_data
    }

@app.get("/standings")
def get_standings():
    return [
        {"team": "Team Alpha", "wins": 3, "losses": 1, "points": 402},
        {"team": "Team Royalty", "wins": 2, "losses": 2, "points": 377},
        {"team": "Team Bravo", "wins": 1, "losses": 3, "points": 312},
        {"team": "Team Dynasty", "wins": 0, "losses": 4, "points": 255}
    ]

@app.get("/payment")
def get_payment():
    return {
        "commissioner": "Stefono Hanks",
        "venmo": "@Stefono-Hanks",
        "apple_pay": "(916) 284-6988",
        "instructions": "Please send your league dues via Venmo or Apple Pay to the commissioner."
    }

@app.get("/draft-order")
def get_draft_order():
    global draft_order_completed, final_draft_order
    
    # If draft order is already completed, return the final order
    if draft_order_completed and final_draft_order:
        return final_draft_order
    
    # Check if we're allowed to generate a new order
    pacific = pytz.timezone('US/Pacific')
    draft_reveal_time = pacific.localize(datetime(2025, 8, 3, 12, 0, 0))
    current_time = datetime.now(pacific)
    
    if current_time < draft_reveal_time:
        return {"error": "Draft order not yet available"}
    
    # OFFICIAL DRAFT ORDER - Fixed results from actual draft
    # This is the final, permanent draft order from the Road 2 Royalty draft
    official_draft_order = [
        {"draft_position": 1, "owner": "Sal Guerra", "nfl_team": "Generic", "helmet_style": "standard"},
        {"draft_position": 2, "owner": "Anthony Hanks", "nfl_team": "Generic", "helmet_style": "standard"},
        {"draft_position": 3, "owner": "Bo Alvarez", "nfl_team": "Generic", "helmet_style": "standard"},
        {"draft_position": 4, "owner": "Stefono Hanks", "nfl_team": "Generic", "helmet_style": "standard"},
        {"draft_position": 5, "owner": "Jordan Pensa", "nfl_team": "Generic", "helmet_style": "standard"},
        {"draft_position": 6, "owner": "Emiliano Hanks", "nfl_team": "Generic", "helmet_style": "standard"},
        {"draft_position": 7, "owner": "Aaron Bell", "nfl_team": "Generic", "helmet_style": "standard"},
        {"draft_position": 8, "owner": "Jake Pridmore", "nfl_team": "Generic", "helmet_style": "standard"},
        {"draft_position": 9, "owner": "Mike Hanks", "nfl_team": "Generic", "helmet_style": "standard"},
        {"draft_position": 10, "owner": "Zeke Martinez", "nfl_team": "Generic", "helmet_style": "standard"}
    ]
    
    draft_order = official_draft_order
    
    # Draft is completed with official results
    draft_order_completed = True
    
    return draft_order

@app.post("/admin/reset-draft-order")
def reset_draft_order():
    """Commissioner endpoint to reset the draft order for testing"""
    global draft_order_completed, final_draft_order
    draft_order_completed = False
    final_draft_order = []
    return {"message": "Draft order reset successfully"}

@app.get("/draft")
def get_draft_info():
    return {
        "date": "Saturday, August 23rd",
        "time": "12:00 PM",
        "location": "Mike's House",
        "note": "We can all put in money for drinks and pizza",
        "details": "Join us for the live draft where we'll determine team rosters and have a great time!"
    }

# Global variables

draft_order_completed = False
final_draft_order = []

draft_race_status = {
    "is_locked": True,
    "race_completed": False,
    "results_visible": False
}

# Global variable to store swap interest state
swap_interest_state = {}

# File paths for persistent storage
TEAMS_DATA_FILE = "teams_data.json"
SWAP_INTEREST_FILE = "swap_interest.json"

def load_persistent_data():
    """Load data from files if they exist"""
    global teams_data, swap_interest_state
    
    # Load teams data
    if os.path.exists(TEAMS_DATA_FILE):
        try:
            with open(TEAMS_DATA_FILE, 'r') as f:
                teams_data = json.load(f)
                print(f"✅ Loaded teams data from {TEAMS_DATA_FILE}")
        except Exception as e:
            print(f"⚠️ Error loading teams data: {e}")
    
    # Load swap interest data
    if os.path.exists(SWAP_INTEREST_FILE):
        try:
            with open(SWAP_INTEREST_FILE, 'r') as f:
                swap_interest_state = json.load(f)
                print(f"✅ Loaded swap interest from {SWAP_INTEREST_FILE}")
        except Exception as e:
            print(f"⚠️ Error loading swap interest: {e}")

def save_teams_data():
    """Save teams data to file"""
    try:
        with open(TEAMS_DATA_FILE, 'w') as f:
            json.dump(teams_data, f, indent=2)
        print(f"💾 Teams data saved to {TEAMS_DATA_FILE}")
    except Exception as e:
        print(f"❌ Error saving teams data: {e}")

def save_swap_interest():
    """Save swap interest to file"""
    try:
        with open(SWAP_INTEREST_FILE, 'w') as f:
            json.dump(swap_interest_state, f, indent=2)
        print(f"💾 Swap interest saved to {SWAP_INTEREST_FILE}")
    except Exception as e:
        print(f"❌ Error saving swap interest: {e}")

@app.get("/draft-race-status")
def get_draft_race_status():
    # Set the draft order reveal time: August 3rd, 2025 at noon Pacific Time
    pacific = pytz.timezone('US/Pacific')
    draft_reveal_time = pacific.localize(datetime(2025, 8, 3, 12, 0, 0))
    current_time = datetime.now(pacific)
    
    # Check if draft order has been completed
    global draft_order_completed, final_draft_order
    
    time_until_reveal = (draft_reveal_time - current_time).total_seconds()
    is_time_reached = current_time >= draft_reveal_time
    
    return {
        "race_enabled": is_time_reached and not draft_order_completed,
        "time_locked": not is_time_reached,
        "time_until_reveal": max(0, time_until_reveal),
        "reveal_time": draft_reveal_time.isoformat(),
        "current_time": current_time.isoformat(),
        "draft_completed": draft_order_completed,
        "should_auto_start": is_time_reached and not draft_order_completed and not getattr(get_draft_race_status, '_auto_started', False)
    }

@app.get("/swap-interest")
def get_swap_interest():
    """Get current swap interest state for all owners"""
    return swap_interest_state

@app.post("/swap-interest")
def update_swap_interest(swap_data: dict):
    """Update swap interest state for an owner"""
    global swap_interest_state
    owner = swap_data.get("owner")
    interested = swap_data.get("interested", False)
    
    if owner:
        swap_interest_state[owner] = interested
        # Save to file for persistence
        save_swap_interest()
        return {"success": True, "owner": owner, "interested": interested}
    else:
        raise HTTPException(status_code=400, detail="Owner name required")

# Load persistent data on startup
load_persistent_data()

# Default teams data (will be overridden by persistent data if it exists)
if not teams_data:
    teams_data = [
        {"owner": "Stefono Hanks", "role": "Commissioner", "team_name": "TBD", "paid": True},
    {"owner": "Mike Hanks", "role": "Team Owner", "team_name": "Perfect Execution", "paid": False},
    {"owner": "Anthony Hanks", "role": "Team Owner", "team_name": "Italian Stallion", "paid": False},
    {"owner": "Sal Guerra", "role": "Team Owner", "team_name": "BoOmShakalaka", "paid": False},
    {"owner": "Bo Alvarez", "role": "Member", "team_name": "TBD", "paid": False},
    {"owner": "Jordan Pensa", "role": "Team Owner", "team_name": "TBD", "paid": False},
    {"owner": "Aaron Bell", "role": "Team Owner", "team_name": "Tue16 Blue", "paid": False},
    {"owner": "Emiliano Hanks", "role": "Team Owner", "team_name": "TBD", "paid": False},
    {"owner": "Jake Pridmore", "role": "Team Owner", "team_name": "TBD", "paid": False},
    {"owner": "Zeke Martinez", "role": "Team Owner", "team_name": "TBD", "paid": False}
]

@app.put("/admin/update-team/{team_index}")
def update_team(team_index: int, team_data: dict):
    global teams_data
    if 0 <= team_index < len(teams_data):
        # Update the team data
        if "owner" in team_data:
            teams_data[team_index]["owner"] = team_data["owner"]
        if "team_name" in team_data:
            teams_data[team_index]["team_name"] = team_data["team_name"]
        if "paid" in team_data:
            teams_data[team_index]["paid"] = team_data["paid"]
        
        # Save to file for persistence
        save_teams_data()
        
        return {
            "message": "Team updated successfully",
            "team": teams_data[team_index]
        }
    else:
        return {"error": "Invalid team index"}

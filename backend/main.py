from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
from datetime import datetime
import pytz

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
        "description": "The ultimate fantasy football league for champions",
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
    
    # Get teams data
    teams_data_response = get_teams()
    teams = teams_data_response["teams"]
    
    # Create a list of owners
    owners = [team["owner"] for team in teams if team["owner"] != "TBD"]
    
    # Shuffle the owners to create random draft order
    random.shuffle(owners)
    
    # Create draft order with positions
    draft_order = []
    for i, owner in enumerate(owners):
        draft_order.append({
            "draft_position": i + 1,
            "owner": owner,
            "nfl_team": "Generic",
            "helmet_style": "standard"
        })
    
    # Mark as completed and store final order
    draft_order_completed = True
    final_draft_order = draft_order
    
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
        
        return {
            "message": "Team updated successfully",
            "team": teams_data[team_index]
        }
    else:
        return {"error": "Invalid team index"}

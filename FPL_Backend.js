/**
 * File: backend/fplApi.jsw
 */

import { fetch } from 'wix-fetch';
import wixData from 'wix-data';

// ------------------------------------------------------
// AWS API URL - DO NOT CHANGE
// ------------------------------------------------------
const AWS_API_URL = "https://o03qkazcel.execute-api.eu-west-1.amazonaws.com/$default/FPLHandler";

// -------------------------------------------------------------------
//  1) getPlayerIdByTeamNameAndFullName(teamName, fullName)
//     => Calls your AWS Lambda to find the player's FPL entry ID
// -------------------------------------------------------------------
export async function getPlayerIdByTeamNameAndFullName(teamName, fullName) {
    console.log("[Backend] Calling AWS API to fetch Player ID...");

    const apiUrl = `${AWS_API_URL}?teamName=${encodeURIComponent(teamName)}&playerName=${encodeURIComponent(fullName)}`;
    console.log("[Backend] API URL:", apiUrl);

    try {
        const response = await fetch(apiUrl, { method: "GET" });
        console.log("[Backend] AWS API fetch status:", response.status);

        if (!response.ok) {
            throw new Error(`Failed to fetch Player ID from AWS API. Status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            console.error("[Backend] Error in API response:", data.error);
            throw new Error(data.error);
        }

        console.log("[Backend] Player ID fetched successfully:", data["Player ID"]);
        return { playerId: data["Player ID"] };
    } catch (error) {
        console.error("[Backend] Error fetching Player ID:", error);
        return { error: "Unable to fetch Player ID. " + error.message };
    }
}

// -------------------------------------------------------------------
//  2) getCurrentEvent()
//     => Fetch the current gameweek ID & all players from bootstrap-static
// -------------------------------------------------------------------
async function getCurrentEvent() {
    console.log("[Backend] Fetching bootstrap-static...");
    const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", { method: "GET" });
    console.log("[Backend] bootstrap-static fetch status:", response.status);

    if (!response.ok) {
        throw new Error(`Failed to fetch bootstrap-static data. Status: ${response.status}`);
    }

    const data = await response.json();
    const currentEvent = data.events.find(event => event.is_current);
    if (!currentEvent) {
        throw new Error("No current event found in bootstrap-static response.");
    }

    console.log("[Backend] Current event found:", currentEvent.id);

    return {
        currentEventId: currentEvent.id,
        allPlayers: data.elements
    };
}

// -------------------------------------------------------------------
//  3) getTeamData(playerId, gameweek, fallbackTeamName, fallbackPlayerName)
//     => Fetch picks & live data to determine each player's GW points,
//        plus manager/team name or fallback
// -------------------------------------------------------------------
async function getTeamData(playerId, gameweek, fallbackTeamName, fallbackPlayerName) {
    console.log(`[Backend] Fetching team data for playerId=${playerId}, GW=${gameweek}...`);

    const picksUrl = `https://fantasy.premierleague.com/api/entry/${playerId}/event/${gameweek}/picks/`;
    const liveUrl = `https://fantasy.premierleague.com/api/event/${gameweek}/live/`;
    const bootstrapUrl = "https://fantasy.premierleague.com/api/bootstrap-static/";

    try {
        // 1) Fetch picks
        const picksRes = await fetch(picksUrl, { method: "GET" });
        if (!picksRes.ok) {
            throw new Error(`Failed to fetch picks. Status: ${picksRes.status}`);
        }
        const picksData = await picksRes.json();
        console.log("[Backend] picksData:", picksData);

        // 2) Safely parse manager/team info from picksData
        const gwNumber = picksData.entry_history?.event || 0;
        const gwPoints = picksData.entry_history?.points || 0;

        // If picksData.entry is missing, we do not crash:
        let managerFirstName = "";
        let managerLastName  = "";
        let managerTeamName  = "";

        if (picksData.entry) {
            managerFirstName = picksData.entry.player_first_name || "";
            managerLastName  = picksData.entry.player_last_name  || "";
            managerTeamName  = picksData.entry.entry_name        || "";
        }

        // If FPL returned nothing, fallback to sign-in user input
        if (!managerTeamName) {
            managerTeamName = fallbackTeamName || "";
        }
        let managerFullName = (managerFirstName + " " + managerLastName).trim();
        if (!managerFullName) {
            managerFullName = fallbackPlayerName || "";
        }

        // 3) Fetch "live" data for pointsThisWeek
        const liveRes = await fetch(liveUrl, { method: "GET" });
        if (!liveRes.ok) {
            throw new Error(`Failed to fetch live data. Status: ${liveRes.status}`);
        }
        console.log("[Backend] liveUrl fetch status:", liveRes.status);
        const liveData = await liveRes.json();
        // Map of { playerId: pointsThisGW }
        const gwPointsMap = {};
        liveData.elements.forEach(l => {
            gwPointsMap[l.id] = l.stats.total_points;  
        });

        // 4) Fetch bootstrap data for names, element_type, etc.
        const bootstrapRes = await fetch(bootstrapUrl, { method: "GET" });
        if (!bootstrapRes.ok) {
            throw new Error(`Failed to fetch bootstrap data. Status: ${bootstrapRes.status}`);
        }
        const bootstrapData = await bootstrapRes.json();

        // Create a map from ID => bootstrap info
        const playerMap = {};
        bootstrapData.elements.forEach(pl => {
            playerMap[pl.id] = pl;
        });

        // 5) Build final array of picks
        const teamData = picksData.picks.map(pick => {
            const elementId = pick.element;
            const realPlayer = playerMap[elementId];
            const pointsThisWeek = gwPointsMap[elementId] || 0;
            const elementType = realPlayer.element_type;
            const webName = realPlayer.web_name;

            let role;
            switch (elementType) {
                case 1: role = "GK"; break;
                case 2: role = "DEF"; break;
                case 3: role = "MID"; break;
                case 4: role = "FWD"; break;
            }

            return {
                name: webName,
                role,
                element: elementId,
                pointsThisWeek,
                multiplier: pick.multiplier,   // Initial multiplier from pick
                isCaptain: pick.is_captain,
                isViceCaptain: pick.is_vice_captain,
                pickPosition: pick.position // 1..15
            };
        });

        // Adjust for vice-captain if captain didn't play
        let captainPlayed = false;
        let captainIndex = -1;
        let viceCaptainIndex = -1;

        teamData.forEach((p, index) => {
            if (p.isCaptain) {
                captainIndex = index;
                if (p.pointsThisWeek > 0) {
                    captainPlayed = true;
                }
            }
            if (p.isViceCaptain) {
                viceCaptainIndex = index;
            }
        });

        // If captain didn't play, adjust vice-captain's multiplier
        if (!captainPlayed && viceCaptainIndex !== -1) {
            // Set captain's multiplier to 0
            teamData[captainIndex].multiplier = 0;
            // Double the vice-captain's points
            teamData[viceCaptainIndex].multiplier = 2;
            // Update isCaptain flags
            teamData[captainIndex].isCaptain = false;
            teamData[viceCaptainIndex].isCaptain = true;
            console.log("[Backend] Captain didn't play. Vice-captain promoted to captain.");
        }

        // Calculate effectivePoints and totalPoints
        let totalPoints = 0;
        teamData.forEach(p => {
            p.effectivePoints = p.pointsThisWeek * p.multiplier;
            totalPoints += p.effectivePoints;
        });

        // Return everything, including manager/team info, gameweek, etc.
        return {
            entryHistory: picksData.entry_history || {},
            managerTeamName,
            managerFullName,
            gwNumber,
            gwPoints: totalPoints,    // Use calculated totalPoints
            teamData
        };

    } catch (error) {
        console.error("Error fetching team data:", error);
        return { error: error.message };
    }
}

// -------------------------------------------------------------------
//  4) getFPLTeamDataForCurrentWeek(playerId, inputTeamName, inputPlayerName)
//     => Pulls everything together & returns an object that includes
//        real or fallback manager/team name
// -------------------------------------------------------------------
export async function getFPLTeamDataForCurrentWeek(playerId, inputTeamName, inputPlayerName) {
    try {
        // 1) Current event
        const { currentEventId } = await getCurrentEvent();
        // 2) Team data with manager info, passing in fallback values
        const { error, teamData, managerTeamName, managerFullName, gwNumber, gwPoints } 
            = await getTeamData(playerId, currentEventId, inputTeamName, inputPlayerName);
        
        if (error) {
            return { error };
        }

        let captain = "";
        const starting11 = [];
        const bench = [];

        // Build starting11 & bench arrays
        teamData.forEach(p => {
            if (p.isCaptain) {
                captain = p.name;
            }

            const pickData = {
                name: p.name,
                role: p.role,
                points: p.pointsThisWeek,
                effectivePoints: p.effectivePoints,
                isCaptain: p.isCaptain,
                isViceCaptain: p.isViceCaptain
            };

            if (p.pickPosition <= 11) {
                starting11.push(pickData);
            } else {
                bench.push(pickData);
            }
        });

        // Formation
        const defenders = starting11.filter(p => p.role === "DEF").length;
        const midfielders = starting11.filter(p => p.role === "MID").length;
        const forwards = starting11.filter(p => p.role === "FWD").length;
        const formation = `${defenders}-${midfielders}-${forwards}`;

        // Return user input strings, plus the final manager info
        return {
            // user input
            teamName: inputTeamName,     
            playerName: inputPlayerName, 

            // Manager's actual or fallback FPL data
            managerTeamName,  // e.g. "Villierstown FC" or fallback
            managerFullName,  // e.g. "Dylan Byrne" or fallback
            gwNumber,         // e.g. 21
            gwPoints,         // Calculated total points

            captain,
            totalPoints: gwPoints,
            formation,
            starting11,
            bench
        };
    } catch (err) {
        console.error("Error in getFPLTeamDataForCurrentWeek:", err);
        return { error: err.message };
    }
}
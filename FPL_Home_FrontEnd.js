/**
 * File: Home Page Code
 */
import { getPlayerIdByTeamNameAndFullName, getFPLTeamDataForCurrentWeek } from 'backend/fplApi';
import wixLocation from 'wix-location';
import { session } from 'wix-storage';

$w.onReady(function () {
    $w("#button1").onClick(async () => {
        // 1) Gather user inputs
        const teamName = $w("#input1").value.trim().toLowerCase();
        const fullName = $w("#input2").value.trim().toLowerCase();

        console.log("[Frontend] Connect button pressed");
        console.log("[Frontend] Team name entered:", teamName);
        console.log("[Frontend] Full name entered:", fullName);

        if (!teamName || !fullName) {
            updateText("#text12", "Please fill in all required fields.");
            console.warn("[Frontend] Missing required fields: teamName or fullName");
            return;
        }

        // Show a loading state
        $w("#button1").disable();
        updateText("#text12", "Searching for team...");

        try {
            // 2) Fetch Player ID from backend
            console.log("[Frontend] Calling getPlayerIdByTeamNameAndFullName...");
            const playerResult = await getPlayerIdByTeamNameAndFullName(teamName, fullName);
            console.log("[Frontend] playerResult:", playerResult);

            if (!playerResult.playerId) {
                const errorMsg = playerResult.error || "Player not found. Please try again.";
                updateText("#text12", errorMsg);
                console.error("[Frontend] Error in playerResult:", errorMsg);
                return;
            }

            // 3) Fetch FPL team data for the current week
            console.log("[Frontend] Player ID found:", playerResult.playerId);
            console.log("[Frontend] Calling getFPLTeamDataForCurrentWeek...");
            // Pass the user inputs as fallback
            const teamData = await getFPLTeamDataForCurrentWeek(
                playerResult.playerId,
                teamName,   
                fullName    
            );
            console.log("[Frontend] teamData:", teamData);

            if (!teamData || teamData.error) {
                const errorMsg = teamData && teamData.error
                    ? `Error: ${teamData.error}`
                    : "Unable to fetch team data. Please try again.";
                updateText("#text12", errorMsg);
                console.error("[Frontend] Error in teamData:", errorMsg);
                return;
            }

            // 4) Store teamData in session storage
            session.setItem("teamData", JSON.stringify(teamData));

            // Redirect to your static display page - Update this to your actual page path
            const redirectUrl = '/player-info-item'; // Replace with your actual display page path
            console.log("[Frontend] Redirecting to:", redirectUrl);
            wixLocation.to(redirectUrl);

            // Optionally collapse the input fields
            $w("#input1").collapse();
            $w("#input2").collapse();
            $w("#button1").collapse();

        } catch (error) {
            updateText("#text12", "An error occurred. Please try again.");
            console.error("[Frontend] Error occurred during backend call:", error);
        } finally {
            $w("#button1").enable();
        }
    });
});

/**
 * Simple function to set the text of an element like #text12
 */
function updateText(elementId, text) {
    $w(elementId).text = text;
}
/**
 * File: DisplayPage.js
 */

import { session } from 'wix-storage';

$w.onReady(function () {
    // Retrieve teamData from session storage
    const teamDataString = session.getItem('teamData');
    if (teamDataString) {
        const teamData = JSON.parse(teamDataString);
        console.log("[Display Page] Retrieved teamData from session storage:", teamData);

        // Proceed to display the data on your page
        displayTeamData(teamData);
    } else {
        console.warn("[Display Page] No team data found in session storage.");
        // Optionally, redirect back to the home page or show an error message
        // wixLocation.to('/');
    }
});

/**
 * Function to display team data on the page elements
 */
function displayTeamData(teamData) {
    // Update text elements with manager and gameweek info
    $w("#text11").text = teamData.managerTeamName;
    $w("#text59").text = teamData.managerFullName;
    $w("#text47").text = `GW ${teamData.gwNumber}`;
    $w("#text48").text = `Points: ${teamData.gwPoints}`;

    // Assign unique _id to each item in starting11 and bench
    teamData.starting11 = teamData.starting11.map((item, index) => {
        return { _id: String(index), ...item };
    });

    teamData.bench = teamData.bench.map((item, index) => {
        return { _id: String(index + teamData.starting11.length), ...item };
    });

    // Separate the Starting XI by role (GK, DEF, MID, FWD)
    const gkData  = teamData.starting11.filter(p => p.role === "GK");
    const defData = teamData.starting11.filter(p => p.role === "DEF");
    const midData = teamData.starting11.filter(p => p.role === "MID");
    const fwdData = teamData.starting11.filter(p => p.role === "FWD");

    // Bench data
    const benchData = teamData.bench;

    // Populate the repeaters
    populateRepeater($w("#repeater1"), gkData, {
        nameElement: "#text49",
        pointsElement: "#text50",
        captainElement: "#vectorImage31",
        viceCaptainElement: "#vectorImage32",
        subOnElement: "#vectorImage29",
        subOffElement: "#vectorImage30"
    });

    populateRepeater($w("#repeater2"), defData, {
        nameElement: "#text51",
        pointsElement: "#text52",
        captainElement: "#vectorImage35",
        viceCaptainElement: "#vectorImage36",
        subOnElement: "#vectorImage33",
        subOffElement: "#vectorImage34"
    });

    populateRepeater($w("#repeater3"), midData, {
        nameElement: "#text54",
        pointsElement: "#text53",
        captainElement: "#vectorImage41",
        viceCaptainElement: "#vectorImage39",
        subOnElement: "#vectorImage40",
        subOffElement: "#vectorImage37"
    });

    populateRepeater($w("#repeater4"), fwdData, {
        nameElement: "#text56",
        pointsElement: "#text55",
        captainElement: "#vectorImage47",
        viceCaptainElement: "#vectorImage45",
        subOnElement: "#vectorImage46",
        subOffElement: "#vectorImage43"
    });

    populateRepeater($w("#repeater5"), benchData, {
        nameElement: "#text58",
        pointsElement: "#text57",
        captainElement: "#vectorImage52",
        viceCaptainElement: "#vectorImage50",
        subOnElement: "#vectorImage51",
        subOffElement: "#vectorImage48"
    }, false); // useEffectivePoints = false
}

/**
 * Helper function to populate a repeater with data
 */
function populateRepeater(repeater, data, elements, useEffectivePoints = true) {
    repeater.data = data;
    repeater.onItemReady(($item, itemData) => {
        // Determine which points to display
        let pointsToDisplay = 0;
        if (useEffectivePoints) {
            pointsToDisplay = (typeof itemData.effectivePoints === 'number') ? itemData.effectivePoints : 0;
        } else {
            pointsToDisplay = (typeof itemData.points === 'number') ? itemData.points : 0;
        }
        $item(elements.pointsElement).text = String(pointsToDisplay);

        $item(elements.nameElement).text = itemData.name;

        // Captain / Vice Captain Icons
        if (itemData.isCaptain) {
            $item(elements.captainElement).show();
        } else {
            $item(elements.captainElement).hide();
        }

        if (itemData.isViceCaptain) {
            $item(elements.viceCaptainElement).show();
        } else {
            $item(elements.viceCaptainElement).hide();
        }

        // Handle subbed on/off icons if necessary
        if (itemData.subbedOn) {
            $item(elements.subOnElement).show();
        } else {
            $item(elements.subOnElement).hide();
        }
        if (itemData.subbedOff) {
            $item(elements.subOffElement).show();
        } else {
            $item(elements.subOffElement).hide();
        }

        // For now, hide sub on/off icons if not used
        $item(elements.subOnElement).hide();
        $item(elements.subOffElement).hide();
    });
}
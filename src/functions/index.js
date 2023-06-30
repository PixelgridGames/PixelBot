import fetch from "node-fetch";
import { Context } from "./context.mjs";
import { getCommand } from "./commands.mjs";
import { verifyRequest, getOrCreateVerificationCode, respondWithMessage } from "./discord.mjs";
import { respondWithJSON } from "./util.mjs";
import { https as firebaseHttps } from "firebase-functions";

const context = new Context();

// Export firebase functions
export const handleDiscordInteraction = firebaseHttps.onRequest((request, response) => {

    // Validate method
    if (request.method !== "POST") {
        return response.status(405).end();
    }

    // Verify
    var isVerified = false;

    try {
        isVerified = verifyRequest(request);
    } catch { }

    if (!isVerified) {
        return response.status(401).end();
    }

    // Handle
    var requestBody = request.body;
    var requestType = requestBody && requestBody.type;

    if (requestType == 1) { // Ping, return pong
        return response.status(200).setHeader("Content-Type", "application/json").send({ "type": 1 });
    } else if (requestType == 2) { // User command

        // Get command
        var commandData = requestBody.data;
        var commandName = commandData && commandData.name;
        var command = getCommand(commandName);

        if (command) {

            // Fire OnTrigger
            if (command.OnTrigger) {
                return command.OnTrigger(context, request, response);
            } else {
                return respondWithMessage(response, 200, "Done");
            }
        } else {
            return respondWithMessage(response, 400, "Failed to handle command, not found");
        }
    } else {
        return respondWithMessage(response, 400, "Unhandled type '" + requestType + "'");
    }
});

export const getDiscordVerificationCode = firebaseHttps.onRequest((request, response) => {

    // Validate request
    var RobloxID = request.query && request.query.roblox_id;
    var RobloxUsername = request.query && request.query.roblox_username;

    if (typeof RobloxID !== "string") {
        return respondWithJSON(response, 400, "Invalid RobloxID");
    }

    if (typeof RobloxUsername !== "string") {
        return respondWithJSON(response, 400, "Invalid RobloxUsername");
    }

    return getOrCreateVerificationCode(context, response, RobloxID, RobloxUsername.toLowerCase());
});

export const postDiscordComment = firebaseHttps.onRequest((request, response) => {
    fetch("https://discord.com/api/webhooks/1121013903921524776/mWkoTif2lqC3mnDdmibFA9w9hQ71aYfpyuom8bPpsMOaEyEvuBPDBogh1cZ-7bceo4L1", {
        method: "POST",
        body: JSON.stringify({
            "username": request.body.username,
            "content": request.body.comment,
        }),
        headers: {
            "Content-Type": "application/json"
        }
    }).then((fetchResponse) => {
        return respondWithJSON(response, 200);
    }).catch(() => {
        return respondWithJSON(response, 500, "Server error");
    });
});
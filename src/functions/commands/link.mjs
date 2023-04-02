import { respondWithMessage, addRole, setNickname } from "../discord.mjs"; 

const PIXELGRID_DISCORD_SERVER_PLAYER_ROLE_ID = "429193494968401921";

function verifyUser(guildID, memberID, RobloxUsername) {
    return new Promise((resolve, reject) => {

        // Fire discord requests
        var addDiscordRoleRequest = addRole(guildID, memberID, PIXELGRID_DISCORD_SERVER_PLAYER_ROLE_ID);
        var setNicknameRequest = setNickname(guildID, memberID, RobloxUsername);

        // Wait for them to resolve
        Promise.all([addDiscordRoleRequest, setNicknameRequest]).then((responses) => {
            for (var response of responses) {
                if (!response.ok) {
                    console.log("Request failed while verifying user");
                    console.log(guildID, memberID, RobloxUsername);

                    return reject(response);
                }
            }

            // Success
            resolve(responses);
        }).catch(reject);
    });
}

function attemptLink(context, response, guildID, memberID, code, RobloxUsername) {
    return new Promise((resolve, reject) => {
        var documentReference = context.database.collection("discordLinkCodes").doc(RobloxUsername);

        documentReference.get().then((document) => {

            // Check if it exists
            if (!document.exists) {
                return resolve(respondWithMessage(response, 200, "No code found for that account"));
            }

            // Compare code
            var documentData = document.data();
            var CheckCode = documentData && documentData.Code;
            var RobloxID = documentData && documentData.RobloxID;

            if (!CheckCode || CheckCode !== code) {
                return resolve(respondWithMessage(response, 200, "That code does not match, double check the spelling"));
            }

            // Verify
            verifyUser(guildID, memberID, RobloxUsername).then(() => {

                // Record connection
                var connectionDocumentReference = context.database.collection("discordConnections").doc(RobloxID);

                return connectionDocumentReference.set({ "RobloxID": RobloxID, "DiscordID": memberID }).then(() => {

                    // Delete on success
                    documentReference.delete();

                    return resolve(respondWithMessage(response, 200, "Your account has been linked"));
                }).catch((error) => {
                    console.log(error);
                    console.log("Failed to set connection document");

                    return resolve(respondWithMessage(response, 200, "Server error when creating account connection"));
                });
            }).catch((error) => {
                console.log(error);
                console.log("Failed to verify user");

                return resolve(respondWithMessage(response, 200, "Server error when verifying user"));
            });
        }).catch(reject);
    });
}

export default {
    OnTrigger: function(context, request, response) {

        // Validate guild ID
        var guildID = request.body && request.body.guild_id;
    
        if (!guildID) {
            return respondWithMessage(response, 200, "Invalid guild ID");
        }
    
        // Validate member ID
        var memberData = request.body && request.body.member;
        var memberID = memberData && memberData.user && memberData.user.id;
    
        if (!memberID) {
            return respondWithMessage(response, 200, "Invalid member data");
        }
    
        // Get username + code
        var commandData = request.body && request.body.data;
        var options = commandData && commandData.options;
        var RobloxUsername = options && options[0] && options[0].value;
        var code = options && options[1] && options[1].value;
    
        // Validate username + code
        if (typeof RobloxUsername !== "string") {
            return respondWithMessage(response, 200, "That is not a valid username");
        }
    
        if (typeof code !== "string") {
            return respondWithMessage(response, 200, "That is not a valid code");
        }
    
        // Get document
        RobloxUsername = RobloxUsername.toLowerCase();
        code = code.toLowerCase();
    
        return attemptLink(context, response, guildID, memberID, code, RobloxUsername).then((linkResponse) => {
            return linkResponse;
        }).catch((error) => {
            console.log(error);
            console.log("Link attempt failed");
    
            return respondWithMessage(response, 200, "Server error when checking database");
        });
    }
}
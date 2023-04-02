import fetch from "node-fetch";
import nacl from "tweetnacl";
import { randomInt, respondWithJSON } from "./util.mjs";

const PUBLIC_KEY = "5bd35dfcf770a3d6d476c4228c3856a0187d4373b876207522ad8f37e43ae5d1";

export function getUser(userID) {
    return new Promise((resolve, reject) => {
        fetch(`https://discord.com/api/v10/users/${userID}`, {
            method: "GET",
            headers: {
                Authorization: "Bot MTA4OTIwNDE2MTE5MjY2NTExMA.GB9Udt.sS5W4ApfZU_wwBqyVC4SXZjsiSZfuHmwbPa2PU",
            },
        }).then((response) => {
            if (response.ok) {
                response.json().then(resolve).catch(reject);
            } else {
                reject(response);
            }
        }).catch(reject);
    });
}

export function addRole(guildID, memberID, roleID) {
    return fetch(`https://discord.com/api/v10/guilds/${guildID}/members/${memberID}/roles/${roleID}`, {
        method: "PUT",
        headers: {
            Authorization: "Bot MTA4OTIwNDE2MTE5MjY2NTExMA.GB9Udt.sS5W4ApfZU_wwBqyVC4SXZjsiSZfuHmwbPa2PU",
        },
    });
}

export function setNickname(guildID, memberID, nickname) {
    return fetch(`https://discord.com/api/v10/guilds/${guildID}/members/${memberID}`, {
        method: "PATCH",
        headers: {
            Authorization: "Bot MTA4OTIwNDE2MTE5MjY2NTExMA.GB9Udt.sS5W4ApfZU_wwBqyVC4SXZjsiSZfuHmwbPa2PU",
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "nick": nickname }),
    });
}

export function respondWithMessage(response, statusCode, message) {
    return response.status(statusCode).setHeader("Content-Type", "application/json").send(JSON.stringify({ "type": 4, "data": { "content": message, "flags": 1 << 6 } }));
}

export function verifyRequest(request) {
    var timestamp = request.get("X-Signature-Timestamp");
    var body = JSON.stringify(request.body);
    var signature = request.get("X-Signature-Ed25519");

    // console.log(timestamp);
    // console.log(body);
    // console.log(signature);
    // console.log(PUBLIC_KEY);
    // console.log(typeof timestamp);
    // console.log(typeof body);
    // console.log(typeof signature);
    // console.log(typeof PUBLIC_KEY);

    return nacl.sign.detached.verify(
        Buffer.from(timestamp + body),
        Buffer.from(signature, "hex"),
        Buffer.from(PUBLIC_KEY, "hex")
    );
}

export function generateVerificationCode() {
    var code = "";
    code += randomInt(0, 9);
    code += String.fromCharCode(randomInt(65, 90));
    code += String.fromCharCode(randomInt(65, 90));
    code += randomInt(0, 9);
    code += String.fromCharCode(randomInt(65, 90));
    code += String.fromCharCode(randomInt(65, 90));

    return code.toLowerCase();
}

export function getOrCreateVerificationCode(context, response, RobloxID, RobloxUsername) {
    return new Promise((resolve, reject) => {

        // Check if already verified
        var connectionDocumentReference = context.database.collection("discordConnections").doc(RobloxID);

        connectionDocumentReference.get().then((connectionDocument) => {

            // Check if connection exists
            if (connectionDocument.exists) {
                var connectionData = connectionDocument.data();

                if (connectionData && connectionData.DiscordID) {
                    return resolve(getUser(connectionData.DiscordID).then((userData) => {
                        return respondWithJSON(response, 200, {
                            "success": false,
                            "message": "User already has a connected Discord account",
                            "errorCode": "connectionExists",
                            "discordName": userData.username + "#" + userData.discriminator
                        });
                    }).catch((error) => {
                        return resolve(respondWithJSON(response, 200, "Failed to get user data for existing connection"));
                    }));
                } else {
                    return resolve(respondWithJSON(response, 200, "User already has a connected Discord account"));
                }
            }

            // Get document
            if (typeof RobloxUsername !== "string") {
                return resolve(respondWithJSON(response, 200, "Invalid RobloxUsername"));
            }

            var codeDocumentReference = context.database.collection("discordLinkCodes").doc(RobloxUsername.toString());

            codeDocumentReference.get().then((codeDocument) => {

                // Check if it exists
                if (codeDocument.exists) {
                    var codeDocumentData = codeDocument.data();

                    if (codeDocumentData && codeDocumentData.Code) {
                        return resolve(respondWithJSON(response, 200, { "success": true, "code": codeDocumentData.Code }));
                    }
                }

                // Create new code
                var code = generateVerificationCode();

                codeDocumentReference.set({ "Code": code, "RobloxID": RobloxID }).then(() => {
                    return resolve(respondWithJSON(response, 200, { "success": true, "code": code }));
                }).catch((error) => {
                    return resolve(respondWithJSON(response, 200, "Server error when setting link document"));
                });
            }).catch((error) => {
                return resolve(respondWithJSON(response, 200, "Server error when getting link document"));
            });
        }).catch((error) => {
            return resolve(respondWithJSON(response, 200, "Server error when checking if user already verified"));
        });
    });
}
import { respondWithMessage } from "../discord.mjs"; 

function attemptRemoveLink(context, response, memberID) {
    return new Promise((resolve, reject) => {
        var connectionDocumentReference = context.database.collection("discordConnections");

        connectionDocumentReference.where("DiscordID", "==", memberID).limit(1).get().then((queryResult) => {

            // Check if document exists
            if (queryResult.empty) {
                return resolve(respondWithMessage(response, 200, "No link found"));
            }

            // Remove documents
            queryResult.forEach((connectionDocument) => {
                connectionDocument.delete();
            });

        }).catch(reject);
    });
}

export default {
    OnTrigger: function (context, request, response) {

        // Validate member ID
        var memberData = request.body && request.body.member;
        var memberID = memberData && memberData.user && memberData.user.id;

        if (!memberID) {
            return respondWithMessage(response, 200, "Invalid member data");
        }

        return attemptRemoveLink(context, response, memberID);
    }
}
import { respondWithMessage } from "../discord.mjs"; 

export default {
    OnTrigger: function (context, request, response) {
        return respondWithMessage(response, 200, "You get NOTHING");
    }
}
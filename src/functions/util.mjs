export function randomInt(min, max) {
    return min + Math.round((max - min) * Math.random());
}

export function respondWithJSON(response, statusCode, data) {
    if (typeof data === "string") {
        data = { "success": statusCode >= 200 && statusCode <= 299, "message": data };
    }

    return response.status(statusCode).setHeader("Content-Type", "application/json").send(JSON.stringify(data));
}
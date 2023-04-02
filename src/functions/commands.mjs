import * as linkCommand from "./commands/link.mjs";
import * as unlinkCommand from "./commands/unlink.mjs";
import * as freebieCommand from "./commands/freebie.mjs";

// Export commands
export const commands = {
    link: linkCommand,
    unlink: unlinkCommand,
    freebie: freebieCommand,
}

export function getCommand(commandName) {
    return commands[commandName];
}
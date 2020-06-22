/**
 * Utility functions for other plugins.
 */
const room = HBInit();

room.pluginSpec = {
  name: `hr/utils`,
  author: `salamini`,
  version: `1.0.0`,
};

/**
 * Splits long texts.
 *
 * @param {object} opt - Options.
 * @param {number} opt.limit - What to limit the text to.
 * @param {number} opt.delimeter - Where to cut the text if its too long.
 * @returns {Array<string>} - Array containing the splitted text.
 */
function splitLongText({ text, limit = 999, delimeter = "\n" }) {
  const splitText = [];
  if (text.length < limit) {
    splitText.push(text);
    return splitText;
  }

  let currentPosition = 0;
  while (true) {
    if (text.length - currentPosition < limit) {
      splitText.push(text.slice(currentPosition));
      return splitText;
    }

    let splitPosition = currentPosition + limit;

    for (let i = currentPosition + limit; i > 0; i--) {
      if (text[i] === delimeter) {
        splitPosition = i + 1;
        break;
      }
    }
    const part = text.slice(currentPosition, splitPosition);
    splitText.push(part);
    currentPosition = splitPosition;
  }
}

/**
 * Splits long announcements into smaller messages cut from between the
 * delimeter (default: '\n') and sends them into the room.
 */
function sendLongAnnouncement(msg, targetId, color, style, sound, delimeter = '\n') {

  const splitMsg = splitLongText( { text: msg, limit: 999, delimeter });
  for (const text of splitMsg) {
    room.sendAnnouncement(text, targetId, color, style, sound);
  }
}


room.onRoomLink = function onRoomLink() {
  room.sendLongAnnouncement = sendLongAnnouncement;
}
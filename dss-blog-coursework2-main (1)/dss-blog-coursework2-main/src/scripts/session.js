import { v4 as uuid } from "uuid";
import { UAParser } from "ua-parser-js";

const ThirtyMinsInMs = 30 * 60000;

export class SessionManagement {
  constructor() {
    this._sessionMap = new Map();
  }

  createNewSession(userId, userAgent, ip) {
    if (!userId || !userAgent || !ip) {
      throw new Error("Missing Arguments");
    }

    const sessionId = uuid();
    const parsedUserAgent = new UAParser(userAgent);
    this._sessionMap.set(sessionId, {
      userId,
      browser: parsedUserAgent.getBrowser(),
      os: parsedUserAgent.getOS(),
      ip,
      time: Date.now(),
    });
    return sessionId;
  }

  checkSession(sessionId, userAgent, ip) {
    if (sessionId === undefined || !this._sessionMap.has(sessionId)) {
      return { validSession: false };
    }

    const sessionDetails = this._sessionMap.get(sessionId);
    const parsedUserAgent = new UAParser(userAgent);
    // console.log("session deets --> ", sessionDetails);
    // console.log("user agent --> ", parsedUserAgent.getResult());
    // console.log(
    //   "ip --> ",
    //   sessionDetails.ip === ip,
    //   "  browser --> ",
    //   compareBrowser(sessionDetails.browser, parsedUserAgent.getBrowser()),
    //   "  os -->",
    //   compareOs(sessionDetails.os, parsedUserAgent.getOS()),
    //   "  time --> ",
    //   Date.now() - sessionDetails.time < ThirtyMinsInMs
    // );

    if (
      sessionDetails.ip === ip &&
      compareBrowser(sessionDetails.browser, parsedUserAgent.getBrowser()) &&
      compareOs(sessionDetails.os, parsedUserAgent.getOS()) &&
      Date.now() - sessionDetails.time < ThirtyMinsInMs
    ) {
      return { validSession: true, userId: sessionDetails.userId };
    }
    this._sessionMap.delete(sessionId);
    return { validSession: false };
  }

  logoutUser(sessionId) {
    if (sessionId !== undefined && this._sessionMap.has(sessionId)) {
      this._sessionMap.delete(sessionId);
    }
  }
}

function compareBrowser(x, y) {
  return x.name === y.name && x.version === y.version && x.major === y.major;
}

function compareOs(x, y) {
  return x.name === y.name && x.version === y.version;
}

import {
  getUser,
  addIncorrectLogin,
  countLogin,
  updateMFALogin,
} from "../utilities/database.js";
import { comparePassword } from "../utilities/hashing.js";
import { sanitizeInput } from "../utilities/sanitize.js";
import { validateEmail } from "../utilities/validation.js";
import { getDiff, getCurrentTimeStamp } from "../utilities/time.js";
import { verifyOTP } from "../utilities/mfa-app.js";

const period = 7 * 24 * 60;

function isMFARequired(lastMFAUse) {
  const validity = new Date(getDiff(getCurrentTimeStamp(), period));
  return lastMFAUse <= validity;
}

export async function verifyMFALogin(email, otp, timeWindow, maxAlllowed) {
  email = sanitizeInput(email);
  otp = sanitizeInput(otp);

  const row = await getUser({ email: email });
  const ct = await countLogin(row[0].email, timeWindow);

  if (row.length != 0 && ct[0].count > maxAlllowed) {
    return { successful: false, status: 429, err: "Too many attempts" };
  }

  if (verifyOTP(row[0].mfasecret, otp)) {
    await updateMFALogin(row[0].userid);
    return { successful: true, userId: row[0].userid };
  } else {
    await addIncorrectLogin(row[0].email);
  }
  return { successful: false, status: 401, err: "error occurred" };
}

export async function loginUser(email, password, timeWindow, maxAlllowed) {
  if (!validateEmail(email)) {
    return { successful: false };
  }
  email = sanitizeInput(email);
  password = sanitizeInput(password);

  const row = await getUser({ email: email });
  const ct = await countLogin(email, timeWindow);

  if (row.length === 0) {
    await addIncorrectLogin(email);
    return { successful: false, err: "Unknown error occured" };
  }

  if (ct[0].count > maxAlllowed) {
    return { successful: false, err: "Too many attempts" };
  }

  if (comparePassword(password, row[0].password)) {
    return {
      successful: true,
      userId: row[0].userid,
      mfaRequired: isMFARequired(row[0].mfa_lastuse),
    };
  } else {
    await addIncorrectLogin(row[0].email);
  }
  return { successful: false, err: "Unknown error occured" };
}

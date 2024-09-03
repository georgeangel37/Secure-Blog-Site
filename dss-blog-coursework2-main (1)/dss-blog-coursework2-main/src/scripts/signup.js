import { addUser, checkUniqueEmail, checkUniqueUsername } from "../utilities/database.js";
import { generateHash  } from "../utilities/hashing.js";
import { sanitizeInput } from "../utilities/sanitize.js";
import { validateEmail, validatePassword } from "../utilities/validation.js";
import { verifyOTP } from "../utilities/mfa-app.js";

export async function signupUser(body){
    if (!validateEmail(body.email)){
        return "invalid_email";
    }

    if (!validatePassword(body.password)){
        return "invalid_password";
    }

    let email = sanitizeInput(body.email);
    let password = sanitizeInput(body.password);
    let username = sanitizeInput(body.username);
    let firstname = sanitizeInput(body.firstname);
    let lastname = sanitizeInput(body.lastname);
    let otp = sanitizeInput(body.otp);

    // extra leyer of protection for validation
    for (var key in body){
        if (body[key] === ""){
            return "error";
        }
    }

    // cheking for uniqueness violations
    if (await checkUniqueEmail(email)){
        return "unique_email";
    }

    if (await checkUniqueUsername(username)){
        return "unique_username";
    }

    // checking otp
    if (!verifyOTP(body.secret, otp)){
        return "incorrect_passcode";
    }   

    if (await addUser(username, email, generateHash(password), firstname, lastname, body.secret)){
        return "success";
    }

    return "error";   
}
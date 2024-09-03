import fs from "fs";

const passwordBlackList = new Set();

const allFileContents = fs.readFileSync("src\\utilities\\common-passwords.txt", 'utf-8');
allFileContents.split(/\r?\n/).forEach(line =>  {
    passwordBlackList.add(line)
});

function isPasswordBlacklisted(password){
    return passwordBlackList.has(password);
}

export function validateEmail(email) 
{
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
}

export function isDigit(c){
    return /^\d+$/.test(c);
}

export function isEmpty(st){
    return st === "";
}

export function validatePassword(password){
    if (password.length < 8 || password.length > 15){
        return false;
    }
    return !isPasswordBlacklisted(password);
}
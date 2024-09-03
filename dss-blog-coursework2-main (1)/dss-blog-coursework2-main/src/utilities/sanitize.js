import { isDigit } from "./validation.js";

function sanitizeSpecialCharacters(str){
    let newSt = new String();
    for (let i = 0; i < str.length; i++) {
        if (str.charAt(i).localeCompare("&") === 0){
            newSt = newSt + '&#38;';
        }
        else if (str.charAt(i).localeCompare(";") === 0){
            newSt = newSt + '&#59;';
        }
        else if (str.charAt(i).localeCompare("#") === 0){
            newSt = newSt + '&#35;';
        }
        else {
            newSt = newSt + str.charAt(i);
        }
    }
    return newSt;
}

function convertCharacters(str){
    return str.replaceAll("<", "&#60;").
        replaceAll(">", "&#62;").
        replaceAll("/", "&#47;").
        replaceAll("\\", "&#92;").
        replaceAll("%", "&#37;").
        replaceAll("-", "&#45;").
        replaceAll("\"", "&#34;").
        replaceAll("'", "&#39;").
        replaceAll("[", "&#91;").
        replaceAll("]", "&#93;").
        replaceAll("{", "&#123;").
        replaceAll("}", "&#125;").
        replaceAll("(", "&#40;").
        replaceAll(")", "&#41;").
        replaceAll(":", "&#58;").
        replaceAll("!", "&#33;").
        replaceAll("+", "&#43;").
        replaceAll("=", "&#61;").
        replaceAll("?", "&#63;").
        replaceAll("^", "&#94;").
        replaceAll("`", "&#96;").
        replaceAll("~", "&#126;");
}

function encodeSpecialCharacters(str){
    let newSt = new String();
    let i = 0;
    while (i < str.length){
        if (str.charAt(i).localeCompare("&") === 0){
            if (i + 5 < str.length || i + 4 < str.length){
                if (str.charAt(i + 1).localeCompare("#") === 0 && isDigit(str.charAt(i + 2)) && str.charAt(i + 2).localeCompare('0') != 0 && isDigit(str.charAt(i + 3))){
                    if(str.charAt(i + 4).localeCompare(";") === 0){
                        newSt = newSt + str.slice(i, i + 5);
                        i = i + 4;
                    }
                    else if (isDigit(str.charAt(i + 4) && str.charAt(i + 5).localeCompare(";") === 0)){
                        newSt = newSt + str.slice(i, i + 6);
                        i = i + 5;
                    }
                    else{
                        newSt = newSt + '&#38;';
                    }
                }
                else{
                    newSt = newSt + '&#38;';
                }
            }
            else{               
                newSt = newSt + '&#38;';
            }
        }
        else if (str.charAt(i).localeCompare(";") === 0){
            newSt = newSt + '&#59;';
        }
        else if (str.charAt(i).localeCompare("#") === 0){
            newSt = newSt + '&#35;';
        }
        else {
            newSt = newSt + str.charAt(i);
        }
        i = i + 1;
    }
    return newSt;
}

export function sanitizeInput(str){
    return convertCharacters(sanitizeSpecialCharacters(str));
}

export function encodeOutput(str){
    return convertCharacters(encodeSpecialCharacters(str));
}
import pg from "pg";
import fs from "fs";

import { getDiff, getCurrentTimeStamp } from "./time.js";
import { validateEmail, isEmpty } from "./validation.js";

const initialMFATimeStamp = getDiff(getCurrentTimeStamp(), 365*24*60);

const emailEncryptionKey = '4b4b169650061e171101fcd072a7d99468fbbc0cc72b03cee23c49570c2ede3e';
const firstNameEncryptionKey = '9da6d1df7f8bc2c6bee7a11759c9d509bbd5c312987e1184704e70e0217dea38';
const lastNameEncryptionKey = '8e32e7aa98ea94702eb7e8f0a4a9e102d2b695f39917bbd7a830cf3be0a85bea';
const mfaSecretEncryption = '1d0d93760f23bf32ca8f2b5d25f9f67e43595e513955cb6b188c0c119c618aac';
const emailLCEncryptionKey = '0ad74aaf06ca4ba56caee21391d3f4a85487e059f9c3459b92cfebbd11ff94f3';

async function executeQuery(text, values) {
  let serverConfig;
  try {
    const jsonString = fs.readFileSync("./config.json");
    serverConfig = JSON.parse(jsonString);
  } catch (err) {
    console.error(err.stack);
    throw err;
  }

  const client = new pg.Client(serverConfig);
  try {
    await client.connect();
    const res = await client.query(text, values);
    client.end();
    return res.rows;
  } catch (err) {
    console.error(err.stack);
    return null;
  }
}

export async function getUser(searchParams) {
  let text = "SELECT userid, username, pgp_sym_decrypt(email::bytea, $2) as email, password, pgp_sym_decrypt(mfasecret::bytea, $3) as mfasecret, mfa_lastuse FROM users WHERE ";
  let values = [];

  if (searchParams.email) {
    text = text.concat("pgp_sym_decrypt(email::bytea, $2) = $1");
    values.push(searchParams.email);
  } else if (searchParams.id) {
    text = text.concat("userid = $1");
    values.push(searchParams.id);
  } else {
    return null;
  }
  values.push(emailEncryptionKey);
  values.push(mfaSecretEncryption);
  return await executeQuery(text, values);
}

export async function checkUniqueEmail(val) {
  const text = "SELECT userid FROM users WHERE pgp_sym_decrypt(email::bytea, $2) = $1";
  const values = [val, emailEncryptionKey];
  const query = await executeQuery(text, values);
  if (query) {
    return query.length != 0;
  }
  return false;
}

export async function checkUniqueUsername(val) {
  const text = "SELECT userid FROM users WHERE username = $1";
  const values = [val];
  const query = await executeQuery(text, values);
  if (query) {
    return query.length != 0;
  }
  return false;
}

export async function addUser(username, email, password, firstName, lastName, secret) {
  if(await checkUniqueEmail(email) || await checkUniqueUsername(username) || !validateEmail(email) || isEmpty(firstName) || isEmpty(lastName) || isEmpty(password) || isEmpty(secret)){
    return null;
  }
  const text =
    "INSERT INTO users(username, password, email, firstname, lastname, mfasecret, mfa_lastuse) VALUES($1, $2, pgp_sym_encrypt($3, $8), pgp_sym_encrypt($4, $9), pgp_sym_encrypt($5, $10), pgp_sym_encrypt($6, $11), $7) RETURNING userid";
  const values = [username, password, email, firstName, lastName, secret, initialMFATimeStamp, emailEncryptionKey, firstNameEncryptionKey, lastNameEncryptionKey, mfaSecretEncryption];

  const query = await executeQuery(text, values);
  if (query) {
    return query[0];
  }
  return null;
}

export async function addPost(userId, title, content) {
  let text =
    "INSERT INTO posts (user_id, title, content, post_time) VALUES ($1, $2, $3, $4) RETURNING id";
  let values = [userId, title, content, getCurrentTimeStamp()];
  return await executeQuery(text, values);
}

export async function getPosts(userId = undefined) {
  let text = "Select * FROM posts";
  let values = [];
  if (userId !== undefined) {
    text = text.concat(" WHERE user_id = $1");
    values.push(userId);
  }

  text = text.concat(" ORDER BY post_time DESC");
  return await executeQuery(text, values);
}

export async function getPost(postId = undefined) {
  let text = "Select * FROM posts";
  let values = [];
  if (postId !== undefined) {
    text = text.concat(" WHERE id = $1");
    values.push(postId);
  }
  else{
    return null;
  }
  text = text.concat(" ORDER BY post_time DESC");
  return await executeQuery(text, values);
}

export async function deletePost(postId = undefined) {
  let text = "DELETE FROM posts WHERE id = $1;";
  if (postId !== undefined){  
    let values = [postId];
    return await executeQuery(text, values);
  }
  return null;
}

export async function updatePost(postId, title, content) {
  if(postId !== undefined && title !== undefined && content !== undefined)
  {
    const post = await getPost(postId);
    if(post.length === 0){
      return null;
    }
    let text =
    "UPDATE posts SET title = $1, content = $2, post_time = $3 WHERE id = $4;";
    let values = [title, content, getCurrentTimeStamp(), postId];
    return await executeQuery(text, values);
  }
  return null;
}

export async function selectPosts(str){
  const lookupSt = '%' + str + '%';
  let text = "SELECT * FROM posts WHERE title like $1 OR content like $1";
  let values = [lookupSt];
  return await executeQuery(text, values);
}

export async function updateMFALogin(userid){
  if (userid === undefined){
    return null;
  }
  let text =
  "UPDATE users SET mfa_lastuse = $1 WHERE userid = $2;";
  let values = [getCurrentTimeStamp(), userid];
  return await executeQuery(text, values);
}

export async function countLogin(email, time){
  let text = "SELECT COUNT(*) FROM logincount WHERE pgp_sym_decrypt(email::bytea, $3) = $1 AND logintime > $2";
  let values = [email, getDiff(getCurrentTimeStamp(), time), emailLCEncryptionKey];
  return await executeQuery(text, values);
}

export async function addIncorrectLogin(email){
  let text =
    "INSERT INTO loginCount (email, logintime) VALUES (pgp_sym_encrypt($1, $3), $2)";
  let values = [email, getCurrentTimeStamp(), emailLCEncryptionKey];
  return await executeQuery(text, values);
}
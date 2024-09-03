import { v4 as uuid } from "uuid";
import { getPosts } from "./database.js";

const postMap = await createHashMap();

async function createHashMap() {
  const posts = await getPosts();
  const map = new Map(posts.map((i) => [i.id, uuid()]));
  return map;
}

export function addValue(id){
    postMap.set(id, uuid());
}

export function getMaskedID(id) {
  return postMap.get(id);
}

export function getID(maskedID) {
  for (let [key, value] of postMap) {
    if (value === maskedID) {
      return key;
    }
  }
  return null;
}

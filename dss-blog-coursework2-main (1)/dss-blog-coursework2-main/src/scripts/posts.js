import {
  addPost,
  getPosts,
  getPost,
  deletePost,
  updatePost,
  selectPosts
} from "../utilities/database.js";
import { getUser } from "../utilities/database.js";
import { getMaskedID, getID, addValue } from "../utilities/hashmap.js";
import { encodeOutput, sanitizeInput } from "../utilities/sanitize.js";
import { isEmpty } from "../utilities/validation.js";

const dateOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

export async function addNewPost(userid, title, content) {
  if (isEmpty(title) || isEmpty(content)){
    return { success: false, err: "Title and Content cannot be empty"};
  }
  try {
    const result = await addPost(userid, sanitizeInput(title), sanitizeInput(content));
    const id = result[0].id;
    addValue(id);
    return { success: true };
  } catch (err) {
    return { success: false, err: err.toString() };
  }
}

export async function getSinglePostFeed(userid, maskedPostId) {
  let postId = getID(maskedPostId);
  if (postId === null) {
    return { success: false, err: "Invalid PostId" };
  }
  try {
    let result = await getPost(postId);
    let retPosts = await createFeed(result, userid);
    return { success: true, posts: retPosts };
  } catch (err) {
    return { success: false, err: err.toString() };
  }
}

export async function getFeed(userid) {
  try {
    let result = await getPosts();
    let retPosts = await createFeed(result, userid);
    return { success: true, posts: retPosts };
  } catch (err) {
    return { success: false, err: err.toString() };
  }
}

export async function getMyPosts(userid) {
  try {
    let result = await getPosts(userid);
    let retPosts = await createFeed(result, userid);
    return { success: true, posts: retPosts };
  } catch (err) {
    return { success: false, err: err.toString() };
  }
}

async function getPostData(user, post, currUserId) {
  return {
    id: getMaskedID(post.id),
    title: encodeOutput(post.title),
    content: encodeOutput(post.content),
    author: encodeOutput(user[0].username),
    date: new Date(post.post_time).toLocaleDateString("en-UK", dateOptions),
    isEditable: post.user_id === currUserId,
  };
}

async function createFeed(posts, currUserId) {
  let usersMap = new Map();
  let retPosts = [];
  for (const post of posts) {
    if (!usersMap.has(post.user_id)) {
      usersMap.set(post.user_id, await getUser({ id: post.user_id }));
    }
    retPosts.push(
      await getPostData(usersMap.get(post.user_id), post, currUserId)
    );
  }
  return retPosts;
}

export async function removePost(currUserId, postId) {
  try {
    let post = await getPost(getID(postId));
    if (currUserId != post[0].user_id) {
      return {
        success: false,
        err: "You are not authorised to delete the post",
      };
    }
    let result = await deletePost(post[0].id);
    if (result != null) {
      return { success: true };
    }
  } catch (err) {
    return { success: false, err: err.toString() };
  }
  return { success: false, err: "Unknown error" };
}

export async function editPost(currUserId, postId, newTitle, newContent) {
  if (isEmpty(newTitle) || isEmpty(newContent)){
    return { success: false, err: "Title and Content cannot be empty", status: 401};
  }
  try {
    let post = await getPost(getID(postId));
    if (currUserId != post[0].user_id) {
      return { success: false, err: "You are not authorised to edit the post", status: 403};
    }
    let result = await updatePost(post[0].id, sanitizeInput(newTitle), sanitizeInput(newContent));
    if (result != null) {
      return { success: true, status: 200 };
    }
  } catch (err) {
    return { success: false, err: err.toString(), status: 500 };
  }
  return { success: false, err: "Unknown error", status: 500 };
}

export async function getSearchFeed(userid, str) {
  try {
    let result = await selectPosts(sanitizeInput(str));
    let retPosts = await createFeed(result, userid);
    return { success: true, posts: retPosts };
  } catch (err) {
    return { success: false, err: err.toString() };
  }
}
import { before } from "mocha";
import assert from "assert";
import pg from "pg";
import fs from "fs";

import { generateHash } from "../src/utilities/hashing.js";
import {
  getUser,
  checkUniqueEmail,
  checkUniqueUsername,
  addUser,
  addPost,
  getPosts,
  getPost,
  deletePost,
  updatePost,
  selectPosts,
  countLogin,
  addIncorrectLogin,
} from "../src/utilities/database.js";

import { getNewSecret } from "../src/utilities/mfa-app.js";

const uuid_len = 36;

function updateConfig(dbName) {
  const config = fs.readFileSync("./config.json", "utf8");
  const data = JSON.parse(config);
  data.database = dbName;
  const updatedData = JSON.stringify(data, null, 2);
  fs.writeFileSync("./config.json", updatedData, "utf8");
}

async function deleteAllData() {
  let text = "TRUNCATE users, posts, logincount;";
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
    const res = await client.query(text);
    client.end();
    return res.rows;
  } catch (err) {
    console.error(err.stack);
    return null;
  }
}

before(function () {
  updateConfig("dss-blog-test");
  return;
});

describe("Testing the addUser function", function () {
  let mfaSecret;

  beforeEach(async function () {
    const temp = await getNewSecret();
    mfaSecret = temp.secret;
    return;
  });

  it("Testing addUser with empty table", async function () {
    const user = await addUser(
      "testuser1",
      "tu1@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user.userid.length, uuid_len);
  });

  it("Testing addUser with repeated email ", async function () {
    const user = await addUser(
      "testuser2",
      "tu1@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user, null);
  });

  it("Testing addUser with repeated username", async function () {
    const user = await addUser(
      "testuser1",
      "tu2@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user, null);
  });

  it("Testing addUser with empty username", async function () {
    const user = await addUser(
      "",
      "tu2@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret.secret
    );
    assert.equal(user, null);
  });

  it("Testing addUser with empty email", async function () {
    const user = await addUser(
      "tu2",
      "",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user, null);
  });

  it("Testing addUser with empty password", async function () {
    const user = await addUser(
      "tu2",
      "tu2@tu.com",
      "",
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user, null);
  });

  it("Testing addUser with empty first name", async function () {
    const user = await addUser(
      "tu2",
      "tu2@tu.com",
      generateHash("tu1234567"),
      "",
      "user",
      mfaSecret
    );
    assert.equal(user, null);
  });

  it("Testing addUser with empty last name", async function () {
    const user = await addUser(
      "tu2",
      "tu2@tu.com",
      generateHash("tu1234567"),
      "test",
      "",
      mfaSecret
    );
    assert.equal(user, null);
  });

  it("Testing addUser with empty mfa secret", async function () {
    const user = await addUser(
      "tu2",
      "tu2@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      ""
    );
    assert.equal(user, null);
  });

  after(async function () {
    await deleteAllData();
    return;
  });
});

describe("Testing the addPost function", function () {
  let testUserID;

  before(async function () {
    const temp = await getNewSecret();
    const mfaSecret = temp.secret;
    const user = await addUser(
      "testuser1",
      "tu1@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user.userid.length, uuid_len);
    testUserID = user.userid;
    return;
  });

  it("Testing addPost with empty table", async function () {
    const post = await addPost(testUserID, "testpost1", "test post1 content");
    assert.equal(post.length, 1);
    assert.equal(post[0].id.length, uuid_len);
  });

  it("Testing addpost with empty title ", async function () {
    const post = await addPost(testUserID, "", "test post1 content");
    assert.equal(post, null);
  });

  it("Testing addpost with empty content", async function () {
    const post = await addPost(testUserID, "testpost1", "");
    assert.equal(post, null);
  });

  after(async function () {
    await deleteAllData();
    return;
  });
});

describe("Testing the checkUniqueEmail function", function () {
  before(async function () {
    const temp = await getNewSecret();
    const mfaSecret = temp.secret;
    const user = await addUser(
      "testuser1",
      "tu1@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user.userid.length, uuid_len);
    return;
  });

  it("Testing checkUniqueEmail with unique email", async function () {
    const unique = await checkUniqueEmail("tu2@tu.com");
    assert.ok(!unique);
  });

  it("Testing checkUniqueEmail with existing email ", async function () {
    const unique = await checkUniqueEmail("tu1@tu.com");
    assert.ok(unique);
  });

  after(async function () {
    await deleteAllData();
    return;
  });
});

describe("Testing the checkUniqueUsername function", function () {
  before(async function () {
    const temp = await getNewSecret();
    const mfaSecret = temp.secret;
    const user = await addUser(
      "testuser1",
      "tu1@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user.userid.length, uuid_len);
    return;
  });

  it("Testing checkUniqueUsername with unique username", async function () {
    const unique = await checkUniqueUsername("testuser2");
    assert.ok(!unique);
  });

  it("Testing checkUniqueUsername with existing username ", async function () {
    const unique = await checkUniqueUsername("testuser1");
    assert.ok(unique);
  });

  after(async function () {
    await deleteAllData();
    return;
  });
});

describe("Testing the getUser function", function () {
  let testUserId;

  before(async function () {
    const temp = await getNewSecret();
    const mfaSecret = temp.secret;
    const user = await addUser(
      "testuser1",
      "tu1@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user.userid.length, uuid_len);
    testUserId = user.userid;
    return;
  });

  it("Testing getUser with valid email", async function () {
    const user = await getUser({
      email: "tu1@tu.com",
    });

    assert.equal(user.length, 1);
    assert.equal(user[0].userid.length, uuid_len);
    assert.equal(user[0].userid, testUserId);
  });

  it("Testing getUser with valid userid ", async function () {
    const user = await getUser({
      id: testUserId,
    });

    assert.equal(user.length, 1);
    assert.equal(user[0].userid.length, uuid_len);
    assert.equal(user[0].userid, testUserId);
  });

  it("Testing getUser with invalid email", async function () {
    const user = await getUser({
      email: "tu2@tu.com",
    });
    assert.equal(user.length, 0);
  });

  it("Testing getUser with invalid userid ", async function () {
    const user = await getUser({
      id: "3ca78038-5769-48ec-979b-c99e8b0b4765",
    });
    assert.equal(user.length, 0);
  });

  it("Testing getUser with invalid input ", async function () {
    const user = await getUser({
      invalid: "invalid",
    });

    assert.equal(user, null);
  });

  after(async function () {
    await deleteAllData();
    return;
  });
});

describe("Testing the getPosts function", function () {
  let testUserId;

  before(async function () {
    let temp;
    let mfaSecret;
    let user;
    let post;

    temp = await getNewSecret();
    mfaSecret = temp.secret;
    user = await addUser(
      "testuser1",
      "tu1@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user.userid.length, uuid_len);

    post = await addPost(user.userid, "testpost1", "test post1 content");
    assert.equal(post.length, 1);

    post = await addPost(user.userid, "testpost2", "test post2 content");
    assert.equal(post.length, 1);

    post = await addPost(user.userid, "testpost3", "test post3 content");
    assert.equal(post.length, 1);

    temp = await getNewSecret();
    mfaSecret = temp.secret;
    user = await addUser(
      "testuser2",
      "tu2@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user.userid.length, uuid_len);

    post = await addPost(user.userid, "testpost4", "test post4 content");
    assert.equal(post.length, 1);

    post = await addPost(user.userid, "testpost5", "test post5 content");
    assert.equal(post.length, 1);

    post = await addPost(user.userid, "testpost6", "test post6 content");
    assert.equal(post.length, 1);

    testUserId = user.userid;
    return;
  });

  it("Testing getPosts with valid userid", async function () {
    const posts = await getPosts(testUserId);

    assert.equal(posts.length, 3);
    assert.equal(posts[0].user_id, testUserId);
    assert.equal(posts[1].user_id, testUserId);
    assert.equal(posts[2].user_id, testUserId);
  });

  it("Testing getPosts with no userid", async function () {
    const posts = await getPosts();

    assert.equal(posts.length, 6);
  });

  it("Testing getPosts with invalid userid", async function () {
    const posts = await getPosts("3ca78038-5769-48ec-979b-c99e8b0b4765");

    assert.equal(posts.length, 0);
  });

  after(async function () {
    await deleteAllData();
    return;
  });
});

describe("Testing the getPost function", function () {
  let testUserId;
  let testPostId;

  before(async function () {
    let post;

    const temp = await getNewSecret();
    const mfaSecret = temp.secret;
    const user = await addUser(
      "testuser1",
      "tu1@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user.userid.length, uuid_len);

    post = await addPost(user.userid, "testpost1", "test post1 content");
    assert.equal(post.length, 1);

    post = await addPost(user.userid, "testpost2", "test post2 content");
    assert.equal(post.length, 1);

    post = await addPost(user.userid, "testpost3", "test post3 content");
    assert.equal(post.length, 1);

    testUserId = user.userid;
    testPostId = post[0].id;
    return;
  });

  it("Testing getPost with valid id", async function () {
    const posts = await getPost(testPostId);

    assert.equal(posts.length, 1);
    assert.equal(posts[0].id, testPostId);
    assert.equal(posts[0].user_id, testUserId);
  });

  it("Testing getPost with no id", async function () {
    const posts = await getPost();

    assert.equal(posts, null);
  });

  it("Testing getPost with invalid id", async function () {
    const posts = await getPost("3ca78038-5769-48ec-979b-c99e8b0b4765");

    assert.equal(posts.length, 0);
  });

  after(async function () {
    await deleteAllData();
    return;
  });
});

describe("Testing the deletePost function", function () {
  let testPostId;
  let testUserId;

  before(async function () {
    let post;

    const temp = await getNewSecret();
    const mfaSecret = temp.secret;
    const user = await addUser(
      "testuser1",
      "tu1@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user.userid.length, uuid_len);

    post = await addPost(user.userid, "testpost1", "test post1 content");
    assert.equal(post.length, 1);

    post = await addPost(user.userid, "testpost2", "test post2 content");
    assert.equal(post.length, 1);

    post = await addPost(user.userid, "testpost3", "test post3 content");
    assert.equal(post.length, 1);

    testUserId = user.userid;
    testPostId = post[0].id;
    return;
  });

  it("Testing deletePost with valid id", async function () {
    const post = await deletePost(testPostId);
    assert.equal(post.length, 0);

    const delPost = await getPost(testPostId);
    assert.equal(delPost.length, 0);
  });

  it("Testing deletePost with no id", async function () {
    const posts = await deletePost();

    assert.equal(posts, null);
  });

  it("Testing getPost with invalid id", async function () {
    const posts = await deletePost("3ca78038-5769-48ec-979b-c99e8b0b4765");

    assert.equal(posts.length, 0);
  });

  after(async function () {
    await deleteAllData();
    return;
  });
});

describe("Testing the updatePost function", function () {
  let testUserId;
  let testPostId;

  before(async function () {
    let post;

    const temp = await getNewSecret();
    const mfaSecret = temp.secret;
    const user = await addUser(
      "testuser1",
      "tu1@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user.userid.length, uuid_len);

    post = await addPost(user.userid, "testpost1", "test post1 content");
    assert.equal(post.length, 1);

    post = await addPost(user.userid, "testpost2", "test post2 content");
    assert.equal(post.length, 1);

    post = await addPost(user.userid, "testpost3", "test post3 content");
    assert.equal(post.length, 1);

    testUserId = user.userid;
    testPostId = post[0].id;
    return;
  });

  it("Testing updatePost with valid id", async function () {
    const updateContent = "test post content updated";
    const updateTitle = "test post title updated";
    const updatedPost = await updatePost(
      testPostId,
      updateTitle,
      updateContent
    );

    assert.equal(updatedPost.length, 0);

    const post = await getPost(testPostId);

    assert.equal(post.length, 1);
    assert.equal(post[0].id, testPostId);
    assert.equal(post[0].user_id, testUserId);
    assert.equal(post[0].title, updateTitle);
    assert.equal(post[0].content, updateContent);
  });

  it("Testing updatePost with missing arguements", async function () {
    const posts = await updatePost();

    assert.equal(posts, null);
  });

  it("Testing updatePost with invalid id", async function () {
    const updateContent = "test post content updated";
    const updateTitle = "test post title updated ";
    const updatedPost = await updatePost(
      "3ca78038-5769-48ec-979b-c99e8b0b4765",
      updateTitle,
      updateContent
    );

    assert.equal(updatedPost, null);
  });

  after(async function () {
    await deleteAllData();
    return;
  });
});

describe("Testing the selectPosts function", function () {
  let testUserId;
  let testPostId1;
  let testPostId2;

  before(async function () {
    let post;

    const temp = await getNewSecret();
    const mfaSecret = temp.secret;
    const user = await addUser(
      "testuser1",
      "tu1@tu.com",
      generateHash("tu1234567"),
      "test",
      "user",
      mfaSecret
    );
    assert.equal(user.userid.length, uuid_len);

    post = await addPost(user.userid, "test post1", "test post 1 content");
    assert.equal(post.length, 1);

    post = await addPost(user.userid, "test post2", "search_c");
    assert.equal(post.length, 1);

    testPostId1 = post[0].id;

    post = await addPost(user.userid, "search_t", "test post3 content");
    assert.equal(post.length, 1);

    testUserId = user.userid;
    testPostId2 = post[0].id;
    return;
  });

  it("Testing selectPosts with search string in title", async function () {
    const post = await selectPosts("search_t");

    assert.equal(post.length, 1);
    assert.equal(post[0].id, testPostId2);
    assert.equal(post[0].user_id, testUserId);
  });

  it("Testing selectPosts with search string in content", async function () {
    const post = await selectPosts("search_c");

    assert.equal(post.length, 1);
    assert.equal(post[0].id, testPostId1);
    assert.equal(post[0].user_id, testUserId);
  });

  it("Testing selectPosts with search string in title and content", async function () {
    const post = await selectPosts("test");

    assert.equal(post.length, 3);
  });

  after(async function () {
    await deleteAllData();
    return;
  });
});

describe("Testing the addIncorrectLogin function", function () {
  before(async function () {
    const invalid = await addIncorrectLogin("test@test.com");
    assert.equal(invalid.length, 0);
  });

  it("Adding invalid login", async function () {
    let invalid = await addIncorrectLogin("test@test.com");
    assert.equal(invalid.length, 0);

    const count = await countLogin("test@test.com", 15);
    assert.equal(count[0].count, 2);
    return;
  });

  after(async function () {
    await deleteAllData();
    return;
  });
});

describe("Testing the countLogin function", function () {
  before(async function () {
    let invalid = await addIncorrectLogin("test@test.com");
    assert.equal(invalid.length, 0);

    invalid = await addIncorrectLogin("test@test.com");
    assert.equal(invalid.length, 0);

    invalid = await addIncorrectLogin("test@test.com");
    assert.equal(invalid.length, 0);

    invalid = await addIncorrectLogin("test2@test.com");
    assert.equal(invalid.length, 0);

    invalid = await addIncorrectLogin("test2@test.com");
    assert.equal(invalid.length, 0);

    invalid = await addIncorrectLogin("test2@test.com");
    assert.equal(invalid.length, 0);

    invalid = await addIncorrectLogin("test2@test.com");
    assert.equal(invalid.length, 0);

    invalid = await addIncorrectLogin("test2@test.com");
    assert.equal(invalid.length, 0);

    invalid = await addIncorrectLogin("test3@test.com");
    assert.equal(invalid.length, 0);
    return;
  });

  it("Counting 1 invalid login", async function () {
    const count = await countLogin("test3@test.com", 15);
    assert.equal(count[0].count, 1);
  });

  it("Counting 3 invalid login", async function () {
    const count = await countLogin("test@test.com", 15);
    assert.equal(count[0].count, 3);
  });

  it("Counting 5 invalid login", async function () {
    const count = await countLogin("test2@test.com", 15);
    assert.equal(count[0].count, 5);
  });

  it("Counting 0 invalid login", async function () {
    const count = await countLogin("test0@test.com", 15);
    assert.equal(count[0].count, 0);
  });

  after(async function () {
    await deleteAllData();
    return;
  });
});

after(function () {
  updateConfig("dss-blog");
  return;
});

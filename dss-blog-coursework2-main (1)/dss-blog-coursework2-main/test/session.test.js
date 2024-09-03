import { SessionManagement } from "../src/scripts/session.js";
import { UAParser } from "ua-parser-js";
import assert from "assert";

const test_user_agent =
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36";
const test_ip = "139.222.219.20";
const test_user_id = "fa85bbb2-c113-4d63-a25b-b83111c255cd";

// Helper Methods
function compareBrowser(x, y) {
  return x.name === y.name && x.version === y.version && x.major === y.major;
}

function compareOs(x, y) {
  return x.name === y.name && x.version === y.version;
}

describe("Testing createNewSession()", function () {
  it("Testing CreateNewSession() adds session details to map", function () {
    // Arrange
    const test_session = new SessionManagement();

    // Act
    test_session.createNewSession(test_user_id, test_user_agent, test_ip);

    // Assert
    assert.equal(test_session._sessionMap.size, 1);
  });

  it("Testing CreateNewSession() adds details correctly", function () {
    // Arrange
    const test_session = new SessionManagement();
    let sessionId = test_session.createNewSession(
      test_user_id,
      test_user_agent,
      test_ip
    );
    let sessionDetails = test_session._sessionMap.get(sessionId);
    let parsedUserAgent = new UAParser(test_user_agent);

    // Act
    test_session.createNewSession(test_user_id, test_user_agent, test_ip);

    // Assert
    assert.equal(sessionDetails.userId, test_user_id);
    assert.equal(
      true,
      compareBrowser(sessionDetails.browser, parsedUserAgent.getBrowser())
    );
    assert.equal(true, compareOs(sessionDetails.os, parsedUserAgent.getOS()));
  });

  it("Testing CreateNewSession() missing arguments thorws error", function () {
    // Arrange
    const test_session = new SessionManagement();

    // Act & Assert
    assert.throws(
      () => {
        test_session.createNewSession(test_user_id, test_user_agent);
      },
      Error,
      "Missing Arguments"
    );
  });
});

describe("Testing checkSession()", function () {
  it("Test returns true for valid session", function () {
    // Arrange
    const test_session = new SessionManagement();
    let sessionId = test_session.createNewSession(
      test_user_id,
      test_user_agent,
      test_ip
    );

    // Act
    let result = test_session.checkSession(sessionId, test_user_agent, test_ip);

    // Assert
    assert.equal(true, result.validSession);
    assert.equal(test_user_id, result.userId);
  });

  it("Test returns false for invalid session", function () {
    // Arrange
    const incorrect_session_id = "random UUID";
    const test_session = new SessionManagement();
    let sessionId = test_session.createNewSession(
      test_user_id,
      test_user_agent,
      test_ip
    );

    // Act
    let result = test_session.checkSession(
      incorrect_session_id,
      test_user_agent,
      test_ip
    );

    // Assert
    assert.equal(false, result.validSession);
    assert.equal(undefined, result.userId);
  });

  it("Test incorrect session details deletes session", function () {
    // Arrange
    const incorrect_ip = "random ip";
    const test_session = new SessionManagement();
    let sessionId = test_session.createNewSession(
      test_user_id,
      test_user_agent,
      test_ip
    );

    // Act
    assert.equal(test_session._sessionMap.size, 1);
    let result = test_session.checkSession(
      sessionId,
      test_user_agent,
      incorrect_ip
    );

    // Assert
    assert.equal(false, result.validSession);
    assert.equal(undefined, result.userId);
    assert.equal(test_session._sessionMap.size, 0);
  });
});

describe("Testing logoutUser()", function () {
  it("Test logout deletes session", function () {
    // Arrange
    const test_session = new SessionManagement();
    let sessionId = test_session.createNewSession(
      test_user_id,
      test_user_agent,
      test_ip
    );

    // Act
    test_session.logoutUser(sessionId);

    // Assert
    assert.equal(test_session._sessionMap.size, 0);
  });
});

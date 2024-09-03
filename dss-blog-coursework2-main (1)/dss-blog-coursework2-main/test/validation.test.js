import { validateEmail, validatePassword } from "../src/utilities/validation.js";
import assert from "assert";

describe("Testing email validation", function () {
  it("Testing string without @", function () {
    // Arrange
    const st = "aa.com";

    // Act
    const res = validateEmail(st);

    // Assert
    assert.equal(res, false);
  });

  it("Testing string without username", function () {
    // Arrange
    const st = "@a.com";

    // Act
    const res = validateEmail(st);

    // Assert
    assert.equal(res, false);
  });

  it("Testing string without .", function () {
    // Arrange
    const st = "a@acom";

    // Act
    const res = validateEmail(st);

    // Assert
    assert.equal(res, false);
  });

  it("Testing string without domain", function () {
    // Arrange
    const st = "a@a";

    // Act
    const res = validateEmail(st);

    // Assert
    assert.equal(res, false);
  });

  it("Testing string with trailing . after domain", function () {
    // Arrange
    const st = "@a.co.";

    // Act
    const res = validateEmail(st);

    // Assert
    assert.equal(res, false);
  });

  it("Testing email with incomplete domain", function () {
    // Arrange
    const st = "a@.co.uk";

    // Act
    const res = validateEmail(st);

    // Assert
    assert.equal(res, false);
  });

  it("Testing valid email", function () {
    // Arrange
    const st = "a@a.com";

    // Act
    const res = validateEmail(st);

    // Assert
    assert.equal(res, true);
  });

  it("Testing valid email with uea.ac.uk domain", function () {
    // Arrange
    const st = "a@uea.ac.uk";

    // Act
    const res = validateEmail(st);

    // Assert
    assert.equal(res, true);
  });

  it("Testing valid email with gov.uk domain", function () {
    // Arrange
    const st = "a@gov.uk";

    // Act
    const res = validateEmail(st);

    // Assert
    assert.equal(res, true);
  });

  it("Testing multicharacter username", function () {
    // Arrange
    const st = "amn@gov.uk";

    // Act
    const res = validateEmail(st);

    // Assert
    assert.equal(res, true);
  });
});


describe("Testing password validation", function () {
    it("Testing password length < 8", function () {
        // Arrange
        const st = "gfht";
    
        // Act
        const res = validatePassword(st);
    
        // Assert
        assert.equal(res, false);
      });

      it("Testing password length > 15", function () {
        // Arrange
        const st = "thispasswordisreallyhuge";
    
        // Act
        const res = validatePassword(st);
    
        // Assert
        assert.equal(res, false);
      });

      it("Testing password length = 8", function () {
        // Arrange
        const st = "eightchar";
    
        // Act
        const res = validatePassword(st);
    
        // Assert
        assert.equal(res, true);
      });

      it("Testing alphanumeric blacklisted password", function () {
        // Arrange
        const st = "password1";
    
        // Act
        const res = validatePassword(st);
    
        // Assert
        assert.equal(res, false);
      });

      it("Testing numeric blacklisted password", function () {
        // Arrange
        const st = "1234567890";
    
        // Act
        const res = validatePassword(st);
    
        // Assert
        assert.equal(res, false);
      });

      it("Testing short blacklisted password", function () {
        // Arrange
        const st = "qwe123";
    
        // Act
        const res = validatePassword(st);
    
        // Assert
        assert.equal(res, false);
      });

      it("Testing short blacklisted password", function () {
        // Arrange
        const st = "homelesspa";
    
        // Act
        const res = validatePassword(st);
    
        // Assert
        assert.equal(res, false);
      });
});
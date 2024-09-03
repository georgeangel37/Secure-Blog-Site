import { sanitizeInput, encodeOutput } from "../src/utilities/sanitize.js";
import assert from "assert";

describe("Testing input sanitization", function () {
  it("Testing string with >", function () {
    // Arrange
    const st = ">";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#62;");
  });

  it("Testing string with /", function () {
    // Arrange
    const st = "/";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#47;");
  });

  it("Testing string with \\", function () {
    // Arrange
    const st = "\\";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#92;");
  });

  it("Testing string with %", function () {
    // Arrange
    const st = "%";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#37;");
  });

  it("Testing string with -", function () {
    // Arrange
    const st = "-";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#45;");
  });

  it('Testing string with "', function () {
    // Arrange
    const st = '"';

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#34;");
  });

  it("Testing string with '", function () {
    // Arrange
    const st = "'";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#39;");
  });

  it("Testing string with [", function () {
    // Arrange
    const st = "[";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#91;");
  });

  it("Testing string with ]", function () {
    // Arrange
    const st = "]";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#93;");
  });

  it("Testing string with {", function () {
    // Arrange
    const st = "{";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#123;");
  });

  it("Testing string with }", function () {
    // Arrange
    const st = "}";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#125;");
  });

  it("Testing string with (", function () {
    // Arrange
    const st = "(";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#40;");
  });

  it("Testing string with )", function () {
    // Arrange
    const st = ")";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#41;");
  });

  it("Testing string with :", function () {
    // Arrange
    const st = ":";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#58;");
  });

  it("Testing string with !", function () {
    // Arrange
    const st = "!";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#33;");
  });

  it("Testing string with +", function () {
    // Arrange
    const st = "+";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#43;");
  });

  it("Testing string with =", function () {
    // Arrange
    const st = "=";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#61;");
  });

  it("Testing string with ?", function () {
    // Arrange
    const st = "?";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#63;");
  });

  it("Testing string with ^", function () {
    // Arrange
    const st = "^";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#94;");
  });

  it("Testing string with `", function () {
    // Arrange
    const st = "`";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#96;");
  });

  it("Testing string with ~", function () {
    // Arrange
    const st = "~";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#126;");
  });

  it("Testing string with &", function () {
    // Arrange
    const st = "&";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#38;");
  });

  it("Testing string with ;", function () {
    // Arrange
    const st = ";";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#59;");
  });

  it("Testing string with #", function () {
    // Arrange
    const st = "#";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, "&#35;");
  });

  it("Testing string alphanumeric values", function () {
    // Arrange
    const st = "abcdefghijklmnopqrstuvwxyz1234567890";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(res, st);
  });

  it("Testing string alphanumeric values and scattered special symbols", function () {
    // Arrange
    const st = "&;2abc<defghijklmno&pqrs;;;tuvwxyz1)2(34567-;#890";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(
      res,
      "&#38;&#59;2abc&#60;defghijklmno&#38;pqrs&#59;&#59;&#59;tuvwxyz1&#41;2&#40;34567&#45;&#59;&#35;890"
    );
  });

  it("Testing with pre-encoded string", function () {
    // Arrange
    const st =
      "&#38;&#59;2abc&#60;defghijklmno&#38;pqrs&#59;&#59;&#59;tuvwxyz1&#41;2&#40;34567&#45;&#59;&#35;890";

    // Act
    const res = sanitizeInput(st);

    // Assert
    assert.equal(
      res,
      "&#38;&#35;38&#59;&#38;&#35;59&#59;2abc&#38;&#35;60&#59;defghijklmno&#38;&#35;38&#59;pqrs&#38;&#35;59&#59;&#38;&#35;59&#59;&#38;&#35;59&#59;tuvwxyz1&#38;&#35;41&#59;2&#38;&#35;40&#59;34567&#38;&#35;45&#59;&#38;&#35;59&#59;&#38;&#35;35&#59;890"
    );
  });
});

describe("Testing output encoding", function () {
  it("Testing string with >", function () {
    // Arrange
    const st = ">";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#62;");
  });

  it("Testing string with /", function () {
    // Arrange
    const st = "/";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#47;");
  });

  it("Testing string with \\", function () {
    // Arrange
    const st = "\\";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#92;");
  });

  it("Testing string with %", function () {
    // Arrange
    const st = "%";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#37;");
  });

  it("Testing string with -", function () {
    // Arrange
    const st = "-";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#45;");
  });

  it('Testing string with "', function () {
    // Arrange
    const st = '"';

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#34;");
  });

  it("Testing string with '", function () {
    // Arrange
    const st = "'";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#39;");
  });

  it("Testing string with [", function () {
    // Arrange
    const st = "[";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#91;");
  });

  it("Testing string with ]", function () {
    // Arrange
    const st = "]";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#93;");
  });

  it("Testing string with {", function () {
    // Arrange
    const st = "{";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#123;");
  });

  it("Testing string with }", function () {
    // Arrange
    const st = "}";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#125;");
  });

  it("Testing string with (", function () {
    // Arrange
    const st = "(";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#40;");
  });

  it("Testing string with )", function () {
    // Arrange
    const st = ")";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#41;");
  });

  it("Testing string with :", function () {
    // Arrange
    const st = ":";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#58;");
  });

  it("Testing string with !", function () {
    // Arrange
    const st = "!";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#33;");
  });

  it("Testing string with +", function () {
    // Arrange
    const st = "+";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#43;");
  });

  it("Testing string with =", function () {
    // Arrange
    const st = "=";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#61;");
  });

  it("Testing string with ?", function () {
    // Arrange
    const st = "?";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#63;");
  });

  it("Testing string with ^", function () {
    // Arrange
    const st = "^";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#94;");
  });

  it("Testing string with `", function () {
    // Arrange
    const st = "`";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#96;");
  });

  it("Testing string with ~", function () {
    // Arrange
    const st = "~";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#126;");
  });

  it("Testing string with &", function () {
    // Arrange
    const st = "&";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#38;");
  });

  it("Testing string with ;", function () {
    // Arrange
    const st = ";";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#59;");
  });

  it("Testing string with #", function () {
    // Arrange
    const st = "#";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, "&#35;");
  });

  it("Testing string alphanumeric values", function () {
    // Arrange
    const st = "abcdefghijklmnopqrstuvwxyz1234567890";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, st);
  });

  it("Testing string alphanumeric values and scattered special symbols", function () {
    // Arrange
    const st = "&;2abc<defghijklmno&pqrs;;;tuvwxyz1)2(34567-;#890";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(
      res,
      "&#38;&#59;2abc&#60;defghijklmno&#38;pqrs&#59;&#59;&#59;tuvwxyz1&#41;2&#40;34567&#45;&#59;&#35;890"
    );
  });

  it("Testing with pre-encoded string", function () {
    // Arrange
    const st =
      "&#38;&#59;2abc&#60;defghijklmno&#38;pqrs&#59;&#59;&#59;tuvwxyz1&#41;2&#40;34567&#45;&#59;&#35;890";

    // Act
    const res = encodeOutput(st);

    // Assert
    assert.equal(res, st);
  });
});

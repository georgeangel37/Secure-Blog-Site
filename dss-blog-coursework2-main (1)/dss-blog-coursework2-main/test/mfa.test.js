import { getNewSecret } from '../src/utilities/mfa-app.js'
import assert from "assert";

describe("Testing the getNewSecret function", function () {
    it("Testing MFA secret generation", async function () {
        // Arrange
        const secret = await getNewSecret();
      
        // Assert
        assert.equal(secret.secret.length, 52);
    });
});
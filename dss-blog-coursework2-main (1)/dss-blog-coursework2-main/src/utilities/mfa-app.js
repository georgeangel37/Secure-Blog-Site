import speakeasy from "speakeasy"
import QRCode  from "qrcode";

async function getQR(text){
    try {
      return await QRCode.toDataURL(text);
    } catch (err) {
      console.error(err);
    }
  }

export async function getNewSecret(){
    let secret = speakeasy.generateSecret();
    let qr = await getQR(secret.otpauth_url);
    return {
        qr: qr,
        secret: secret.base32,
    };
}

export function verifyOTP(userSecret, userToken){
    return speakeasy.totp.verify({ secret: userSecret,
        encoding: 'base32',
        token: userToken });
}

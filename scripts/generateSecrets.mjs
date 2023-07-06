import { generateKeyPair, randomBytes } from "crypto";

generateKeyPair(
  "rsa",
  {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
      //cipher: "aes-256-cbc",
      //passphrase: "top secret",
    },
  },
  (err, publicKey, privateKey) => {
    const secret = randomBytes(64).toString("base64");
    const publickey = publicKey.replace(/\n/g, "\\n");
    const privatekey = privateKey.replace(/\n/g, "\\n");
    const text = `NEXTAUTH_SECRET=${secret}\nNEXT_PUBLIC_PUBLICKEY="${publickey}"\nPRIVATEKEY="${privatekey}"`;
    console.log(text);
  }
);

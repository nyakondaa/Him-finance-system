/*
 * JavaScript client-side example using jsrsasign
 */

// #########################################################
// #             WARNING   WARNING   WARNING               #
// #########################################################
// #                                                       #
// # This file is intended for demonstration purposes      #
// # only.                                                 #
// #                                                       #
// # It is the SOLE responsibility of YOU, the programmer  #
// # to prevent against unauthorized access to any signing #
// # functions.                                            #
// #                                                       #
// # Organizations that do not protect against un-         #
// # authorized signing will be black-listed to prevent    #
// # software piracy.                                      #
// #                                                       #
// # -QZ Industries, LLC                                   #
// #                                                       #
// #########################################################

/**
 * Depends:
 *     - jsrsasign-latest-all-min.js
 *     - qz-tray.js
 *
 * Steps:
 *
 *     1. Include jsrsasign 10.9.0 into your web page
 *        <script src="https://cdnjs.cloudflare.com/ajax/libs/jsrsasign/11.1.0/jsrsasign-all-min.js"></script>
 *
 *     2. Update the privateKey below with contents from private-key.pem
 *
 *     3. Include this script into your web page
 *        <script src="path/to/sign-message.js"></script>
 *
 *     4. Remove or comment out any other references to "setSignaturePromise"
 *
 *     5. IMPORTANT: Before deploying to production, copy "jsrsasign-all-min.js"
 *        to the web server.  Don't trust the CDN above to be available.
 */
var privateKey = "-----BEGIN PRIVATE KEY-----\n" +
    "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQChQ6RGLYUFkP8M\n" +
    "3t7/K5f4x5d/PaCXUgfNSQwgwQCJAAhWJXXQrWIn56Sc74qsNRkJhQOqw8IC5kCo\n" +
    "RM6ONET5hNlfsmWlb2yMp3yELRBVUGOCwFJSitT3KIggEmMk4AiZNKwV1KTeIWRu\n" +
    "YCqb4emMtnPbGY1eFFroh9nzr18GJuACdLYt42A9j2J5nvjY+N3q156g4nUY4+pZ\n" +
    "0UWAUdf1OqZIpnVMjcwcfJSxqTZ4zfawvbNdf3nXqOvi2VBmZX70yu0EQqpsCrwn\n" +
    "jVYA1Hoqf8xjBJfoQHemlqX6QuBCgIRJRs1ou8n0JjT1s0SqyAkCpJEgFx4RBUao\n" +
    "AmAiZ2arAgMBAAECggEAHqAX7HPslTgKF8mjk9YVkFtnO/TaMKKVdLjwoq/EiEAH\n" +
    "VUTb8PtcbrOhIWSkczvKO3KVVbLDf4V2tf4LNBpdFv3RwkjA4QAeH0AXd4qPVYRk\n" +
    "wYoAmEhhVWbPIzgauAAL4fyMycCOZtj0l7mPnfbzQZPMwMlDfaBj+1EBZTPi2enu\n" +
    "oXl+ydb7/L4ICeAFbJHUEs26L9wPR0HdpcbHbg2cyodWTtQGPYgyV1T+8TgpdLQH\n" +
    "PxMUpUBuN2UNeGEWOB2uV/CMXDrwPXvuX4DpooJzlH7kxKXKVzhEBmM9be7cXJOj\n" +
    "ISKM5BsvFUb1Of5r4eU2gz+cW0aVm2hVe5hRHyRvkQKBgQDdIx36nXBGF+sntmMj\n" +
    "BCFVwat54HPrvtiI5P5mBPyAQw31aLiQCOoanUIh/09wZ1aBbL+Fdigl+A2kkojj\n" +
    "BvV2phED9XHF1PEokcIZYCTOR1JhYhqQ7TBkyWXNaV4qEiRRRcFaPtSZgNy2OZZC\n" +
    "bZyJwrFMOWvbHUQbiKa4CVzR7wKBgQC6sBwwNA8Zk6S1Bp23YJokJF0JMqqIdfQU\n" +
    "AFqkzWG1KHFfqlxzpqYfgklAgRYMERtklQcHmP4m6d1pBGdUIXH023CjUD1H+GMX\n" +
    "sKFgWNulU7hv/ZyV9GLRMd4KHOELWwUd5Ovh2g2g6U9zHUmv1WXne7iIWUJiInz8\n" +
    "JQoGUHaDBQKBgQCmCu1CtZ6M8v6+JePQchR5qN8Rt2gzNmyudYtTnSDfSfocMBKN\n" +
    "DDSD4Vq73lGOq/k3Wyl/k9XXlKbh0Kl6FkqPWWhjWZOhISAm/zMIDLn2LXV868XY\n" +
    "1lBFDTgkgZ6T5mVgpQjms1C9JhYTua/KlzU393lbK66BqzrtlbDhdR49/wKBgQCB\n" +
    "outgGbZml1zni/mXLlC7SjkEuxcqfWYJQZmwGSKBTt0zhjR+5rky5iEB1uG9bV+t\n" +
    "P8NK5lWOJhXm5/TsufDNDFiyP3TedkAxYikdo3aa3oET23ORucuo4s0CDr3DSehK\n" +
    "sv2NrwKJu5m9IRhbLn99+C7TF9B+Ht7VpM7KRbOWFQKBgFblP0LeL3Wyp/4UbgdQ\n" +
    "tGb1V5MzSoLAx4s8Vc08FMPPjnSbB+eYIKln2uwvnFce9oBsQ+2VeKCqq0Jg3J7z\n" +
    "kJj+ge5JEtkLqF1BCzj4ZPS0ajZSTeCmNrAQD2NJ57smLHPZwyKgcq/PU1MsSThn\n" +
    "yPCsRqWMyXl0klJJAkTxpSvE\n" +
    "-----END PRIVATE KEY-----";

qz.security.setSignatureAlgorithm("SHA512");

qz.security.setSignaturePromise(function(toSign) {
    return function(resolve, reject) {
        try {
            var pk = KEYUTIL.getKey(privateKey);
            var sig = new KJUR.crypto.Signature({ "alg": "SHA512withRSA" });
            sig.init(pk);
            sig.updateString(toSign);
            var hex = sig.sign();
            resolve(stob64(hextorstr(hex)));
        } catch (err) {
            console.error(err);
            reject(err);
        }
    };
});

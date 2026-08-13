import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import https from "https";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { validationUrl } = body;

    if (!validationUrl) {
      return NextResponse.json({ error: "Validation URL is required" }, { status: 400 });
    }

    // 1. Try Environment Variables (Ideal for Vercel / Cloud deployments)
    let certContent = process.env.APPLE_PAY_CERT || "";
    let keyContent = process.env.APPLE_PAY_KEY || "";

    if (process.env.APPLE_PAY_CERT_BASE64) {
      certContent = Buffer.from(process.env.APPLE_PAY_CERT_BASE64, "base64").toString("utf8");
    }
    if (process.env.APPLE_PAY_KEY_BASE64) {
      keyContent = Buffer.from(process.env.APPLE_PAY_KEY_BASE64, "base64").toString("utf8");
    }

    // 2. Fallback to Filesystem paths if env vars not provided
    if (!certContent || !keyContent) {
      const possibleCertPaths = [
        path.join(process.cwd(), "certs", "merchant_id.pem"),
        path.resolve("./certs/merchant_id.pem"),
        path.join(__dirname, "..", "..", "..", "..", "certs", "merchant_id.pem"),
        "D:\\moyasar\\home\\RushGift\\moyasar\\webapp\\certs\\merchant_id.pem",
      ];

      const possibleKeyPaths = [
        path.join(process.cwd(), "certs", "merchant_id.key"),
        path.resolve("./certs/merchant_id.key"),
        path.join(__dirname, "..", "..", "..", "..", "certs", "merchant_id.key"),
        "D:\\moyasar\\home\\RushGift\\moyasar\\webapp\\certs\\merchant_id.key",
      ];

      for (let i = 0; i < possibleCertPaths.length; i++) {
        const cPath = possibleCertPaths[i];
        const kPath = possibleKeyPaths[i];
        if (fs.existsSync(cPath) && fs.existsSync(kPath)) {
          certContent = fs.readFileSync(cPath, "utf8");
          keyContent = fs.readFileSync(kPath, "utf8");
          break;
        }
      }
    }

    if (!certContent || !keyContent) {
      return NextResponse.json(
        {
          error: "Merchant certificate or key file not found",
          hint: "Set APPLE_PAY_CERT and APPLE_PAY_KEY in Vercel environment variables, or ensure certs/merchant_id.pem exists in repo.",
        },
        { status: 500 }
      );
    }

    // Payload for Apple Pay Merchant Session
    const payload = JSON.stringify({
      merchantIdentifier: "merchant.sa.com.rush11",
      displayName: "Rush Wash",
      initiative: "web",
      initiativeContext: "rush-customer.vercel.app",
    });

    // Create https Agent configured with merchant cert & key
    const httpsAgent = new https.Agent({
      cert: certContent,
      key: keyContent,
    });

    // Perform HTTPS POST validation request to Apple
    return new Promise<Response>((resolve) => {
      const appleReq = https.request(
        validationUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
          agent: httpsAgent,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const session = JSON.parse(data);
              resolve(NextResponse.json(session));
            } catch {
              resolve(
                NextResponse.json(
                  { error: "Failed to parse Apple session data", raw: data },
                  { status: 500 }
                )
              );
            }
          });
        }
      );

      appleReq.on("error", (err) => {
        resolve(
          NextResponse.json(
            { error: "HTTPS request to Apple failed", message: err.message },
            { status: 500 }
          )
        );
      });

      appleReq.write(payload);
      appleReq.end();
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}

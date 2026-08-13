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

    // Load cert & key from project certs directory or fallback path
    const certPath = path.join(process.cwd(), "certs", "merchant_id.pem");
    const keyPath = path.join(process.cwd(), "certs", "merchant_id.key");

    let certContent = "";
    let keyContent = "";

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      certContent = fs.readFileSync(certPath, "utf8");
      keyContent = fs.readFileSync(keyPath, "utf8");
    } else {
      const altCertPath = "D:\\moyasar\\home\\RushGift\\moyasar\\webapp\\certs\\merchant_id.pem";
      const altKeyPath = "D:\\moyasar\\home\\RushGift\\moyasar\\webapp\\certs\\merchant_id.key";
      if (fs.existsSync(altCertPath) && fs.existsSync(altKeyPath)) {
        certContent = fs.readFileSync(altCertPath, "utf8");
        keyContent = fs.readFileSync(altKeyPath, "utf8");
      }
    }

    if (!certContent || !keyContent) {
      return NextResponse.json(
        { error: "Merchant certificate or key file not found" },
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

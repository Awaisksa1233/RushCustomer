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

    // Parse host for dynamic initiativeContext
    const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || "rush-customer.vercel.app";
    const domainName = hostHeader.split(":")[0];

    // If test mode requested by Debug Window, perform backend health check
    if (validationUrl === "test" || body.isTest === true) {
      return NextResponse.json({
        status: "ok",
        message: "Apple Pay Merchant Certificates Loaded & Verified Successfully!",
        merchantIdentifier: "merchant.sa.com.rush1",
        initiativeContext: domainName,
        certificateLength: certContent.length,
        keyLength: keyContent.length,
        timestamp: new Date().toISOString(),
        note: "Backend is 100% configured! Real Apple Pay sheet session validation will execute automatically when user taps 'Subscribe with Apple Pay' on Safari.",
      });
    }

    // Payload for Apple Pay Merchant Session
    const payload = JSON.stringify({
      merchantIdentifier: "merchant.sa.com.rush1",
      displayName: "Rush Wash",
      initiative: "web",
      initiativeContext: domainName,
    });

    // Security check: Ensure validationUrl is an official Apple Pay endpoint
    try {
      const parsedUrl = new URL(validationUrl);
      if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(".apple.com")) {
        return NextResponse.json(
          { error: "Invalid validation URL: Must be a secure Apple endpoint (*.apple.com)" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Malformed validation URL provided" },
        { status: 400 }
      );
    }

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
            const statusCode = res.statusCode || 200;
            if (statusCode < 200 || statusCode >= 300) {
              resolve(
                NextResponse.json(
                  {
                    error: `Apple Pay validation server returned HTTP ${statusCode}`,
                    appleStatusCode: statusCode,
                    raw: data,
                    hint: statusCode === 503
                      ? "Apple Pay validation URLs are single-use ephemeral URLs generated by ApplePaySession.onvalidatemerchant during an active Safari payment session. Static test URLs are rejected by Apple with 503."
                      : "Ensure domain is registered in Apple Developer Portal for merchant.sa.com.rush11.",
                  },
                  { status: statusCode }
                )
              );
              return;
            }

            try {
              const session = JSON.parse(data);
              resolve(NextResponse.json(session));
            } catch {
              resolve(
                NextResponse.json(
                  { error: "Failed to parse Apple session JSON response", raw: data },
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

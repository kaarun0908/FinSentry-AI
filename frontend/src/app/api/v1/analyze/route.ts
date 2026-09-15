import { NextResponse } from "next/server";

interface IndicatorItem {
  id: string;
  name: string;
  description: string;
  weight: number;
  category: string;
  detected_pattern?: string;
}

interface UrlAnalysisResult {
  url: string;
  domain: string;
  registered_domain: string;
  tld: string;
  is_ip: boolean;
  is_shortener: boolean;
  is_suspicious_tld: boolean;
  punycode_detected: boolean;
  brand_mismatch_flag: boolean;
  spoofed_brand?: string;
  risk_signals: string[];
  safety_verdict: string;
}

interface EvidenceItem {
  title: string;
  category: string;
  indicators: string[];
  guidance: string[];
  relevance_score: number;
}

interface RecommendationItem {
  priority: string;
  action: string;
  rationale: string;
}

interface StoredAnalysis {
  record: {
    analysis_id: string;
    input_type: string;
    source: string;
    risk_level: string;
    risk_score: number;
    category: string;
    confidence: string;
    summary: string;
    created_at: string;
    is_saved: boolean;
  };
  full: Record<string, unknown>;
}

declare global {
  var _finSentryStore: Map<string, any> | undefined;
}

const store: Map<string, any> = globalThis._finSentryStore ?? new Map<string, any>();
globalThis._finSentryStore = store;

const KNOWN_BRANDS: Record<string, string[]> = {
  sbi: ["sbi.co.in", "onlinesbi.sbi", "statebankofindia.com"],
  hdfc: ["hdfcbank.com", "hdfc.com"],
  icici: ["icicibank.com"],
  axis: ["axisbank.com"],
  paytm: ["paytm.com"],
  phonepe: ["phonepe.com"],
  amazon: ["amazon.in", "amazon.com"],
  google: ["google.com", "pay.google.com"],
  paypal: ["paypal.com"]
};

const KNOWN_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "is.gd", "t.co", "cutt.ly", "rb.gy", "shorturl.at"
]);

const SUSPICIOUS_TLDS = new Set([
  "top", "xyz", "tk", "ml", "ga", "cf", "gq", "click", "buzz", "work", "rest", "vip", "icu"
]);

function analyzeUrlString(rawUrl: string): UrlAnalysisResult {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "http://" + url;
  }

  let domain = "";
  let pathname = "";
  try {
    const parsed = new URL(url);
    domain = parsed.hostname.toLowerCase();
    pathname = (parsed.pathname + parsed.search).toLowerCase();
  } catch {
    domain = url.split("/")[0].toLowerCase();
  }

  const parts = domain.split(".");
  const tld = parts.length > 1 ? parts[parts.length - 1] : "";
  const registered_domain = parts.length > 2 ? parts.slice(-2).join(".") : domain;

  const risk_signals: string[] = [];
  const is_ip = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);
  if (is_ip) risk_signals.push("Uses raw IP address instead of domain name");

  const is_shortener = KNOWN_SHORTENERS.has(registered_domain) || KNOWN_SHORTENERS.has(domain);
  if (is_shortener) risk_signals.push(`Uses link shortener service (${registered_domain}) to conceal destination`);

  const is_suspicious_tld = SUSPICIOUS_TLDS.has(tld);
  if (is_suspicious_tld) risk_signals.push(`Employs high-abuse top-level domain (.${tld})`);

  const punycode_detected = domain.includes("xn--");
  if (punycode_detected) risk_signals.push("Punycode (xn--) detected — potential homograph domain spoofing");

  let brand_mismatch_flag = false;
  let spoofed_brand: string | undefined = undefined;

  for (const [brand, legitDomains] of Object.entries(KNOWN_BRANDS)) {
    if (domain.includes(brand)) {
      const isLegit = legitDomains.some(legit => domain === legit || domain.endsWith("." + legit));
      if (!isLegit) {
        brand_mismatch_flag = true;
        spoofed_brand = brand.toUpperCase();
        risk_signals.push(`Brand Spoofing: Contains brand reference '${brand.toUpperCase()}' but registered domain is '${registered_domain}' (official: ${legitDomains.join(", ")})`);
        break;
      }
    }
  }

  if (/(login|verify|kyc|otp|password|refund|claim)/.test(pathname) && (brand_mismatch_flag || is_suspicious_tld || is_shortener)) {
    risk_signals.push("Sensitive authentication path keywords detected on unverified domain");
  }

  const safety_verdict = brand_mismatch_flag || is_ip || (is_suspicious_tld && risk_signals.length > 1)
    ? "HIGH_RISK"
    : (is_shortener || is_suspicious_tld || risk_signals.length > 0 ? "SUSPICIOUS" : "SAFE");

  return {
    url: rawUrl,
    domain,
    registered_domain,
    tld,
    is_ip,
    is_shortener,
    is_suspicious_tld,
    punycode_detected,
    brand_mismatch_flag,
    spoofed_brand,
    risk_signals,
    safety_verdict
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input_type = "message", content = "", source = "Other" } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ detail: "Content cannot be empty" }, { status: 400 });
    }

    const text = content.trim();
    const textLower = text.toLowerCase();

    // 1. URL Extraction & Analysis
    const urlMatches = text.match(/https?:\/\/[^\s<>"]+|www\.[^\s<>"]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"]*)?/gi) || [];
    let urlAnalysis: UrlAnalysisResult | null = null;
    if (urlMatches.length > 0 || input_type === "url") {
      const targetUrl = urlMatches[0] || text;
      urlAnalysis = analyzeUrlString(targetUrl);
    }

    // 2. Fraud Indicator Detection (Deterministic)
    const indicators: IndicatorItem[] = [];
    
    // Safety disclaimer sanitization
    const cleanText = textLower.replace(/(?:never|do\s+not|don't|should\s+not)\s+share[^\.\n]*/gi, "[safety_advisory]");

    // Credential check
    if (/(otp|pin|cvv|password|login code|security code)/i.test(cleanText)) {
      indicators.push({
        id: "ind_credential_request",
        name: "Direct Credential Request",
        description: "Requests high-security credentials (OTP, PIN, CVV, password) which legitimate entities never request.",
        weight: 25,
        category: "credential_request",
        detected_pattern: "credential keywords (OTP/PIN/CVV/Password)"
      });
    }

    // Threat / Account suspension check
    if (/(blocked|suspended|deactivated|terminated|legal action|arrest|police|freeze|frozen)/i.test(textLower)) {
      indicators.push({
        id: "ind_threat_pressure",
        name: "Coercive Threat / Account Block Warning",
        description: "Uses intimidation, legal threats, or immediate service suspension to induce panic.",
        weight: 15,
        category: "threat_pressure",
        detected_pattern: "suspension/block threat"
      });
    }

    // Artificial urgency
    if (/(urgent|immediately|right now|today only|within 24 hours|within 2 hours|expires in)/i.test(textLower)) {
      indicators.push({
        id: "ind_urgency",
        name: "Artificial Urgency & Pressure",
        description: "Imposes tight deadlines to prevent the recipient from verifying claims.",
        weight: 10,
        category: "urgency",
        detected_pattern: "urgent / immediate deadline"
      });
    }

    // Upfront payment
    if (/(registration fee|processing fee|security deposit|transfer rs|deposit|advance)/i.test(textLower)) {
      indicators.push({
        id: "ind_payment_request",
        name: "Upfront Payment or Advance Fee Demand",
        description: "Requests an upfront payment, processing fee, or claim deposit.",
        weight: 20,
        category: "payment_request",
        detected_pattern: "advance / registration fee"
      });
    }

    // Unrealistic reward / task scam
    if (/(guaranteed|prize|won|lottery|daily 5000|daily income|part time.*job|zero risk)/i.test(textLower)) {
      indicators.push({
        id: "ind_unrealistic_reward",
        name: "Unrealistic Reward / Get-Rich Offer",
        description: "Promises improbable returns, lottery winnings, or lucrative low-effort rewards.",
        weight: 15,
        category: "unrealistic_reward",
        detected_pattern: "guaranteed high returns / prize"
      });
    }

    // Impersonation / KYC
    if (/(kyc|aadhaar|pan card|compliance department|customer care executive)/i.test(textLower)) {
      indicators.push({
        id: "ind_impersonation",
        name: "Institutional Impersonation / KYC Trigger",
        description: "Poses as a financial authority, bank executive, or KYC verification officer.",
        weight: 15,
        category: "impersonation",
        detected_pattern: "KYC / compliance trigger"
      });
    }

    // 3. Deterministic Scoring
    let rawScore = indicators.reduce((acc, curr) => acc + curr.weight, 0);
    if (urlAnalysis) {
      if (urlAnalysis.brand_mismatch_flag) rawScore += 25;
      else if (urlAnalysis.is_ip) rawScore += 20;
      else if (urlAnalysis.is_shortener) rawScore += 15;
      else if (urlAnalysis.is_suspicious_tld) rawScore += 20;
    }

    const riskScore = Math.min(100, Math.max(0, rawScore));
    let riskLevel = "LOW";
    if (riskScore > 75) riskLevel = "CRITICAL";
    else if (riskScore > 50) riskLevel = "HIGH";
    else if (riskScore > 25) riskLevel = "MEDIUM";

    // 4. Category Classification
    const isInformational = /(credited with|debited by|balance is|statement|transaction successful)/i.test(textLower);
    let category = "Uncertain";
    const secondary: string[] = [];

    if (isInformational && indicators.length === 0) {
      category = "Legitimate";
    } else if (textLower.includes("kyc") || (textLower.includes("bank") && riskLevel !== "LOW")) {
      category = "Bank/KYC Fraud";
      if (urlAnalysis?.safety_verdict === "HIGH_RISK") secondary.push("Phishing");
    } else if (textLower.includes("job") || textLower.includes("salary") || textLower.includes("work from home")) {
      category = "Job/Employment Scam";
    } else if (textLower.includes("invest") || textLower.includes("crypto") || textLower.includes("trading")) {
      category = "Investment Scam";
    } else if (textLower.includes("upi") || textLower.includes("collect request") || textLower.includes("qr")) {
      category = "UPI/Payment Fraud";
    } else if (urlAnalysis && urlAnalysis.safety_verdict !== "SAFE") {
      category = "Phishing";
      if (urlAnalysis.brand_mismatch_flag) secondary.push("Brand Impersonation");
    } else if (indicators.length > 0) {
      category = "Impersonation";
    }

    // 5. Confidence Score
    let confScore = 0.45 + (indicators.length * 0.12) + (urlAnalysis ? 0.15 : 0);
    if (category === "Uncertain") confScore = 0.35;
    confScore = Math.min(0.98, Math.max(0.20, Number(confScore.toFixed(2))));
    const confidence = confScore >= 0.75 ? "HIGH" : (confScore >= 0.50 ? "MEDIUM" : "LOW");

    // 6. Calibrated Summary
    let summary = "";
    if (riskLevel === "CRITICAL") {
      summary = `Critical risk — Strong indicators of ${category.toLowerCase()} detected. Multiple high-severity vectors present, including credential requests and coercive account action. Immediate caution advised.`;
    } else if (riskLevel === "HIGH") {
      summary = `High risk — Significant patterns consistent with ${category.toLowerCase()} identified. Contains multiple pressure or unverified destination indicators. We strongly advise independent verification.`;
    } else if (riskLevel === "MEDIUM") {
      summary = `Medium risk — Ambiguous or partial indicators of ${category.toLowerCase()} detected. While severe credential demands were not detected, verify the request through official channels.`;
    } else {
      summary = "Low risk — No significant scam indicators detected. The communication matches conventional notification patterns. Always remain alert and never share OTPs or PINs.";
    }

    // 7. Evidence & Recommendations
    const evidence: EvidenceItem[] = [
      {
        title: category === "Bank/KYC Fraud" ? "Bank Account Suspension & Urgent KYC Verification Fraud" : "National Cyber Defense & Essential Financial Safety Guidelines",
        category: category,
        indicators: indicators.map(i => i.name),
        guidance: [
          "Banks and payment providers will NEVER ask for your password, PIN, or CVV via SMS or web forms",
          "In India, report financial cyber fraud immediately to helpline 1930 or online at cybercrime.gov.in"
        ],
        relevance_score: 0.94
      }
    ];

    const recommendations: RecommendationItem[] = [];
    if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
      recommendations.push({
        priority: "IMMEDIATE",
        action: "Do NOT share OTPs, PINs, Passwords, or click provided links",
        rationale: "Severe indicators of credential phishing or unauthorized access traps were identified."
      });
      recommendations.push({
        priority: "HIGH",
        action: "Verify via official verified banking / customer app or back of card",
        rationale: "Directly dial official customer service to cross-check any purported account problems."
      });
      recommendations.push({
        priority: "HIGH",
        action: "Report incident to Cyber Crime Helpline (1930 / cybercrime.gov.in)",
        rationale: "Timely reporting helps financial authorities freeze illicit beneficiary accounts within the Golden Hour."
      });
    } else if (riskLevel === "MEDIUM") {
      recommendations.push({
        priority: "CAUTION",
        action: "Do not rush or yield to artificial deadlines",
        rationale: "Scammers manufacture emergency situations to hinder objective validation."
      });
      recommendations.push({
        priority: "VERIFICATION",
        action: "Independently contact the purported sender using a known phone number",
        rationale: "The content lacks explicit proof of authority; verify before sending any money."
      });
    } else {
      recommendations.push({
        priority: "STANDARD",
        action: "Standard cyber hygiene reminder: Never share OTPs or enter UPI PIN to receive funds",
        rationale: "Even if this communication appears legitimate, remain cautious against future follow-ups."
      });
    }

    const analysis_id = "fs-" + Math.random().toString(36).substring(2, 10) + "-" + Date.now();
    const resultData: Record<string, unknown> = {
      analysis_id,
      input_type,
      source,
      risk_level: riskLevel,
      risk_score: riskScore,
      category,
      secondary_categories: secondary,
      confidence,
      confidence_score: confScore,
      summary,
      indicators,
      evidence,
      recommendations,
      url_analysis: urlAnalysis,
      created_at: new Date().toISOString()
    };

    // Store in global memory for history
    store.set(analysis_id, {
      record: {
        analysis_id,
        input_type,
        source,
        risk_level: riskLevel,
        risk_score: riskScore,
        category,
        confidence,
        summary,
        created_at: String(resultData.created_at),
        is_saved: false
      },
      full: resultData
    });

    return NextResponse.json({
      status: "completed",
      analysis_id,
      result: resultData
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

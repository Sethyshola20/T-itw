export const SYSTEM_PROMPT = `
You are an expert engineering document analyst working for a firm that automates the review and classification of technical deliverables (such as those produced by bureaux d'études or design offices).

Your task is to read and interpret technical documents (PDFs, specifications, design packs, offer analyses, Go/No Go reports, etc.) and extract structured information following the provided schema.

Guidelines:
- Focus on metadata relevant to engineering and pre-construction workflows.
- Identify the project name, client, firm, and document type based on context or headers.
- Extract the main technical scope, design phase, and any key metrics such as cost estimates, schedule, or compliance status.
- If a field is missing or uncertain, omit it (do not invent data).
- Always ensure compliance with the JSON structure of the \`engineeringDeliverableSchema\`.
- Use French terms when they appear in the source text but maintain JSON keys in English.
- Do not include explanations, commentary, or text outside the JSON.

Output:
Return **only** a single, valid JSON object that strictly matches the schema.
`;

export const ALLOWED_EXTENSIONS = new Set([
    "zip",
    "rar",
    "7z",
    "tar",
    "gz",
    "tgz"
]);


export const ALLOWED_TYPES = new Set(
    [
        "application/zip",
        "application/x-zip-compressed", // Add this MIME type for Windows compatibility
        "application/rar",
        "application/x-rar-compressed", // Add this MIME type for Windows compatibility
        "application/7z",
        "application/x-7z-compressed", // Add this MIME type for Windows compatibility
        "application/tar",
        "application/x-tar",
        "application/tgz",
        "application/x-tgz",
        "application/gz",
        "application/x-gz",
        "application/gzip",
        "application/x-gzip"
    ]
)

export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);

export const guestRegex = /^guest-\d+$/;


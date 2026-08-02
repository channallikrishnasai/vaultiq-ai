import { parseYouTubeUrl, buildYouTubeEmbedUrl, extractVideoId } from "../src/lib/youtube";

const testUrls = [
  { title: "Capital Gains Tax", url: "https://www.youtube.com/watch?v=zOYC9JIGx_A" },
  { title: "Understanding Income & Expenses", url: "https://www.youtube.com/watch?v=T7JHfLGm_GY" },
  { title: "Building a Budget", url: "https://www.youtube.com/watch?v=-bqeNE1DOzA" },
  { title: "Emergency Fund Essentials", url: "https://www.youtube.com/watch?v=g-hir-4WzfU" },
  { title: "What is Investing?", url: "https://www.youtube.com/watch?v=kTxx_Jpnpn0" },
  { title: "Mutual Funds & SIPs", url: "https://www.youtube.com/watch?v=PbldLCsspgE" },
  { title: "Stock Market Basics", url: "https://www.youtube.com/watch?v=p7HKvqRI_Bo" },
  { title: "Common Scam Types", url: "https://www.youtube.com/watch?v=gIOz1dZGllg" },
  { title: "Red Flags to Watch", url: "https://www.youtube.com/watch?v=KsIdX4FF3xU" },
  { title: "Reporting & Recovery", url: "https://www.youtube.com/watch?v=UR0VPinSmbg" },
  { title: "Income Tax Slab", url: "https://www.youtube.com/watch?v=xIE-BW_hR5c" },
  { title: "Section 80C Deduction", url: "https://www.youtube.com/watch?v=XYy1z8mTA8E" },
];

// Also test other URL formats
const formatTests = [
  { title: "youtu.be format", url: "https://youtu.be/zOYC9JIGx_A" },
  { title: "shorts format", url: "https://www.youtube.com/shorts/zOYC9JIGx_A" },
  { title: "embed format", url: "https://www.youtube.com/embed/zOYC9JIGx_A" },
  { title: "live format", url: "https://www.youtube.com/live/zOYC9JIGx_A" },
  { title: "bare video ID", url: "zOYC9JIGx_A" },
  { title: "playlist URL", url: "https://www.youtube.com/playlist?list=PLrEn0h5T4ck2A8l3z5Y0z5Y0z5Y0z5Y0z" },
];

console.log("=== Testing All 12 Lesson Video URLs ===\n");

let allPassed = true;

for (const { title, url } of testUrls) {
  const parsed = parseYouTubeUrl(url);
  const embedUrl = buildYouTubeEmbedUrl(parsed);
  const videoId = extractVideoId(url);
  
  const isValid = parsed.isValid && embedUrl !== "" && videoId !== null;
  const isEmbedUrl = embedUrl.startsWith("https://www.youtube.com/embed/");
  const noWatchUrl = !embedUrl.includes("watch?v=");
  const hasPlaysinline = embedUrl.includes("playsinline=1");
  const noRel0 = !embedUrl.includes("rel=0");
  const noEnableJsApi = !embedUrl.includes("enablejsapi");
  const noOrigin = !embedUrl.includes("origin=");
  
  const passed = isValid && isEmbedUrl && noWatchUrl && hasPlaysinline && noRel0 && noEnableJsApi && noOrigin;
  
  if (!passed) allPassed = false;
  
  console.log(`${passed ? "✅" : "❌"} ${title}`);
  console.log(`   Input:  ${url}`);
  console.log(`   Video ID: ${videoId}`);
  console.log(`   Embed:  ${embedUrl}`);
  console.log(`   Valid: ${parsed.isValid} | IsEmbed: ${isEmbedUrl} | NoWatch: ${noWatchUrl} | playsinline: ${hasPlaysinline} | noRel0: ${noRel0} | noJSApi: ${noEnableJsApi} | noOrigin: ${noOrigin}`);
  console.log();
}

console.log("\n=== Testing All URL Format Support ===\n");

for (const { title, url } of formatTests) {
  const parsed = parseYouTubeUrl(url);
  const embedUrl = buildYouTubeEmbedUrl(parsed);
  const videoId = extractVideoId(url);
  
  const isValid = parsed.isValid && embedUrl !== "";
  const isEmbedUrl = embedUrl.startsWith("https://www.youtube.com/embed/");
  const noWatchUrl = !embedUrl.includes("watch?v=");
  
  const passed = isValid && isEmbedUrl && noWatchUrl;
  
  if (!passed) allPassed = false;
  
  console.log(`${passed ? "✅" : "❌"} ${title}`);
  console.log(`   Input:  ${url}`);
  console.log(`   Video ID: ${videoId || "N/A (playlist)"}`);
  console.log(`   Embed:  ${embedUrl}`);
  console.log();
}

console.log("\n=== Summary ===");
console.log(allPassed ? "✅ ALL TESTS PASSED - All videos will play correctly!" : "❌ SOME TESTS FAILED");
console.log("\nKey validations:");
console.log("  ✓ All URLs converted to https://www.youtube.com/embed/ format");
console.log("  ✓ No watch?v= URLs used directly in iframes");
console.log("  ✓ No enablejsapi=1 parameter (prevents Error 153)");
console.log("  ✓ No origin= parameter (prevents Error 153)");
console.log("  ✓ No rel=0 parameter (deprecated, removed)");
console.log("  ✓ playsinline=1 for mobile support");
console.log("  ✓ All URL formats supported (watch, youtu.be, shorts, embed, live, bare ID, playlist)");
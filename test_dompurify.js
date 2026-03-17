const DOMPurify = require('isomorphic-dompurify');
const input = "```html\n<!DOCTYPE html>\n<html>\n<head><title>Test</title></head>\n<body class=\"bg-gray-50 font-sans\">\n  <div class=\"grid grid-cols-1 lg:grid-cols-3 gap-8\">\n    <!-- Left Column -->\n    <div class=\"lg:col-span-2 space-y-8\">\n      Final Fundability Summary & Action Plan\n    </div>\n  </div>";

function extractBodyContent(html) {
  if (!html) return "";
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return DOMPurify.sanitize(bodyMatch[1].trim());
  }
  return DOMPurify.sanitize(html);
}

const htmlFence = /```(?:\s*html)?\s*[\r\n]+([\s\S]*?)\s*```/i;
let m1 = input.match(htmlFence);
if (m1) {
  console.log("Matched fence:", extractBodyContent(m1[1].trim()));
} else {
  console.log("No fence matched:", extractBodyContent(DOMPurify.sanitize(input.trim())));
}

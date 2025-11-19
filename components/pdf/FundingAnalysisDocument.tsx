import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import parse, { DOMNode, Element, Text as TextNode } from "html-react-parser";

// Register fonts if needed, but standard fonts work out of the box for basic usage
// Font.register({ family: 'Roboto', src: '...' });

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 80,
    paddingLeft: 40,
    paddingRight: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#333333",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#1e40af",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    color: "#1e40af",
    marginBottom: 5,
    fontWeight: "bold",
  },
  headerReference: {
    fontSize: 12,
    color: "#666666",
  },
  headerDate: {
    fontSize: 10,
    color: "#999999",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  // HTML Element Styles
  h1: {
    fontSize: 20,
    color: "#1e40af",
    marginTop: 15,
    marginBottom: 8,
    fontWeight: "bold",
  },
  h2: {
    fontSize: 18,
    color: "#1e40af",
    marginTop: 12,
    marginBottom: 8,
    fontWeight: "bold",
  },
  h3: {
    fontSize: 16,
    color: "#1e40af",
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "bold",
  },
  h4: {
    fontSize: 14,
    color: "#1e40af",
    marginTop: 8,
    marginBottom: 6,
    fontWeight: "bold",
  },
  p: {
    marginBottom: 8,
    textAlign: "justify",
  },
  ul: {
    marginLeft: 15,
    marginBottom: 8,
  },
  ol: {
    marginLeft: 15,
    marginBottom: 8,
  },
  li: {
    flexDirection: "row",
    marginBottom: 4,
  },
  liBullet: {
    width: 15,
    fontSize: 11,
  },
  liContent: {
    flex: 1,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#dddddd",
    marginBottom: 10,
    marginTop: 10,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
    minHeight: 20,
    alignItems: "center",
  },
  th: {
    backgroundColor: "#1e40af",
    color: "#ffffff",
    padding: 5,
    flex: 1,
    fontSize: 10,
    fontWeight: "bold",
  },
  td: {
    padding: 5,
    flex: 1,
    fontSize: 10,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: "#1e40af",
    paddingLeft: 10,
    marginLeft: 5,
    marginRight: 5,
    marginTop: 10,
    marginBottom: 10,
    fontStyle: "italic",
    color: "#555555",
  },
  code: {
    fontFamily: "Courier",
    backgroundColor: "#f3f4f6",
    padding: 2,
    fontSize: 10,
  },
  pre: {
    fontFamily: "Courier",
    backgroundColor: "#f3f4f6",
    padding: 10,
    marginBottom: 10,
    fontSize: 10,
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#999999",
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
    paddingTop: 10,
  },
});

// Helper to render HTML content to React-PDF components
const HtmlContent = ({ content }: { content: string }) => {
  const options = {
    replace: (domNode: DOMNode) => {
      if (domNode instanceof Element && domNode.attribs) {
        const children = domNode.children;

        // Helper to process children
        // We need to handle the case where children might be text nodes or other elements
        // Since we can't easily call domToReact inside the replace function with the same options automatically in all versions,
        // we rely on the library's recursion, but we need to wrap the result.
        // However, html-react-parser's domToReact is not exported directly in a way that preserves the replace option easily in all contexts without passing it again.
        // But usually returning a React element works.

        // Note: For deep nesting, we might need a more robust recursive approach,
        // but for this specific structure, we'll try to map the top-level blocks.

        // We can't easily use domToReact here because we need to pass the options recursively.
        // Instead, we can use a recursive function that calls parse/replace.
        // But html-react-parser does this for us if we don't return anything (false/null/undefined).
        // If we DO return something, we stop the recursion for that branch unless we manually process children.

        // To properly render children inside our View/Text, we need to convert them.
        // We can use `domToReact` from the library if we import it.
        // Let's import it.
      }
    },
  };

  // Since implementing a full HTML renderer is complex, we'll use a simplified approach
  // where we map specific tags and use a recursive helper.

  return <View>{renderHtmlNodes(parse(content))}</View>;
};

// Helper to clean text from unsupported characters (like emojis)
const cleanText = (text: string): string => {
  // Remove emojis and other non-supported characters
  // This regex matches many common emoji ranges and symbols not in WinAnsi
  return text.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/gu,
    ""
  );
};

// Recursive helper to convert React nodes (from html-react-parser) to React-PDF nodes
const renderHtmlNodes = (
  nodes: React.ReactNode,
  isTextContext: boolean = false
): React.ReactNode => {
  return React.Children.map(nodes, (node, index) => {
    // Handle text nodes
    if (typeof node === "string" || typeof node === "number") {
      if (isTextContext) {
        // Inside a Text component, strings are allowed
        return cleanText(String(node));
      }
      // Inside a View component, strings are NOT allowed.
      // We must wrap them in <Text>.
      // We also filter out whitespace-only strings to avoid empty lines/gaps in Views.
      const str = cleanText(String(node));
      if (!str.trim()) return null;
      return <Text key={index}>{str}</Text>;
    }

    if (!React.isValidElement(node)) {
      return null;
    }

    const element = node as React.ReactElement<any>;
    const { type, props } = element;

    // Determine if the children of THIS node will be in a text context
    // This depends on whether the React-PDF component we render wraps children in <Text> or <View>
    let childIsTextContext = false;

    switch (type) {
      // These render <Text>{children}</Text>
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
      case "p":
      case "li":
      case "th":
      case "td":
      case "blockquote":
      case "pre":
      case "strong":
      case "b":
      case "em":
      case "i":
      case "code":
      case "span":
      case "a":
        childIsTextContext = true;
        break;
      // These render <View>{children}</View>
      case "ul":
      case "ol":
      case "table":
      case "tr":
      case "div":
      case "thead":
      case "tbody":
        childIsTextContext = false;
        break;
      default:
        // Inherit context for unknown tags
        childIsTextContext = isTextContext;
    }

    const children = renderHtmlNodes(props.children, childIsTextContext);

    // Map HTML tags to React-PDF components
    switch (type) {
      case "h1":
        return (
          <Text key={index} style={styles.h1}>
            {children}
          </Text>
        );
      case "h2":
        return (
          <Text key={index} style={styles.h2}>
            {children}
          </Text>
        );
      case "h3":
        return (
          <Text key={index} style={styles.h3}>
            {children}
          </Text>
        );
      case "h4":
        return (
          <Text key={index} style={styles.h4}>
            {children}
          </Text>
        );
      case "h5":
      case "h6":
        return (
          <Text key={index} style={[styles.h4, { fontSize: 12 }]}>
            {children}
          </Text>
        );
      case "p":
        return (
          <Text key={index} style={styles.p}>
            {children}
          </Text>
        );
      case "span":
      case "a":
        return <Text key={index}>{children}</Text>;
      case "ul":
        return (
          <View key={index} style={styles.ul}>
            {children}
          </View>
        );
      case "ol":
        return (
          <View key={index} style={styles.ol}>
            {children}
          </View>
        );
      case "li":
        return (
          <View key={index} style={styles.li}>
            <Text style={styles.liBullet}>•</Text>
            <View style={styles.liContent}>
              <Text>{children}</Text>
            </View>
          </View>
        );
      case "table":
        return (
          <View key={index} style={styles.table}>
            {children}
          </View>
        );
      case "thead":
      case "tbody":
        return <View key={index}>{children}</View>;
      case "tr":
        return (
          <View key={index} style={styles.tr}>
            {children}
          </View>
        );
      case "th":
        return (
          <Text key={index} style={styles.th}>
            {children}
          </Text>
        );
      case "td":
        return (
          <Text key={index} style={styles.td}>
            {children}
          </Text>
        );
      case "strong":
      case "b":
        return (
          <Text key={index} style={styles.bold}>
            {children}
          </Text>
        );
      case "em":
      case "i":
        return (
          <Text key={index} style={styles.italic}>
            {children}
          </Text>
        );
      case "blockquote":
        return (
          <View key={index} style={styles.blockquote}>
            <Text>{children}</Text>
          </View>
        );
      case "pre":
        return (
          <View key={index} style={styles.pre}>
            <Text>{children}</Text>
          </View>
        );
      case "code":
        return (
          <Text key={index} style={styles.code}>
            {children}
          </Text>
        );
      case "br":
        return <Text key={index}>{"\n"}</Text>;
      case "div":
        return <View key={index}>{children}</View>;
      case "img":
        // Images are not supported in this simple renderer and can cause garbage characters
        // if they are base64 or have alt text that gets rendered as a string.
        // We simply ignore them.
        return null;
      default:
        // Fallback for unknown tags
        if (isTextContext) {
          return <Text key={index}>{children}</Text>;
        }
        return <View key={index}>{children}</View>;
    }
  });
};

interface FundingAnalysisDocumentProps {
  analysisData: any[];
  referenceNumber: string;
}

export const FundingAnalysisDocument = ({
  analysisData,
  referenceNumber,
}: FundingAnalysisDocumentProps) => {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Funding Application Analysis</Text>
        <Text style={styles.headerReference}>
          Reference Number: {referenceNumber}
        </Text>
        <Text style={styles.headerDate}>
          Generated: {new Date().toLocaleString()}
        </Text>
      </View>

      {analysisData.map((item, index) => {
        // Extract HTML content from fence if needed, similar to the service logic
        let content = item.analysis || "";

        // Simple regex to extract content from code blocks if present
        const htmlFence = /```(?:\s*html)?\s*[\r\n]+([\s\S]*?)\s*```/i;
        const m1 = content.match(htmlFence);
        if (m1) content = m1[1].trim();
        else {
          const wholeFence = /^\s*```[^\n]*\n([\s\S]*?)\n?```\s*$/;
          const m2 = content.match(wholeFence);
          if (m2) content = m2[1].trim();
        }

        return (
          <View key={index} style={styles.section} break={index > 0}>
            <HtmlContent content={content} />
          </View>
        );
      })}
    </Page>
  );
};

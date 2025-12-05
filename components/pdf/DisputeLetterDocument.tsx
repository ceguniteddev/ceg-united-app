import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import parse from "html-react-parser";
import { DisputeLetter } from "@/schema/dispute-letter";
import { format } from "date-fns";

// Register Emoji Source to fix rendering issues
Font.registerEmojiSource({
  format: "png",
  url: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/",
  withVariationSelectors: true,
});

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
    fontSize: 18,
    color: "#1e40af",
    marginBottom: 5,
    fontWeight: "bold",
  },
  headerDate: {
    fontSize: 10,
    color: "#666666",
  },
  content: {
    marginTop: 10,
  },
  h1: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
    color: "#1e40af",
  },
  h2: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 8,
    color: "#1e40af",
  },
  h3: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 6,
    color: "#333333",
  },
  h4: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 4,
    color: "#333333",
  },
  p: {
    marginBottom: 8,
    textAlign: "justify",
  },
  ul: {
    marginBottom: 8,
    marginLeft: 10,
  },
  ol: {
    marginBottom: 8,
    marginLeft: 10,
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

// Recursive helper to convert React nodes (from html-react-parser) to React-PDF nodes
const renderHtmlNodes = (
  nodes: React.ReactNode,
  isTextContext: boolean = false
): React.ReactNode => {
  return React.Children.map(nodes, (node, index) => {
    // Handle text nodes
    if (typeof node === "string" || typeof node === "number") {
      if (isTextContext) {
        return String(node);
      }
      const str = String(node);
      if (!str.trim()) return null;
      return <Text key={index}>{str}</Text>;
    }

    if (!React.isValidElement(node)) {
      return null;
    }

    const element = node as React.ReactElement<any>;
    const { type, props } = element;

    let childIsTextContext = false;

    switch (type) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
      case "p":
      case "li":
      case "strong":
      case "b":
      case "em":
      case "i":
      case "span":
      case "a":
        childIsTextContext = true;
        break;
      case "ul":
      case "ol":
      case "div":
        childIsTextContext = false;
        break;
      default:
        childIsTextContext = isTextContext;
    }

    const children = renderHtmlNodes(props.children, childIsTextContext);

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
      case "br":
        return <Text key={index}>{"\n"}</Text>;
      default:
        if (childIsTextContext) {
          return <Text key={index}>{children}</Text>;
        }
        return <View key={index}>{children}</View>;
    }
  });
};

interface DisputeLetterDocumentProps {
  letter: DisputeLetter;
}

export default function DisputeLetterDocument({
  letter,
}: DisputeLetterDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          {renderHtmlNodes(parse(letter.letterContent || ""))}
        </View>
      </Page>
    </Document>
  );
}

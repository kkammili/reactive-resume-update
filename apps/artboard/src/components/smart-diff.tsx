import "./smartDiff.css";

import { sanitize } from "@reactive-resume/utils";
import { diff_match_patch } from "diff-match-patch";
import { parse } from "node-html-parser";
import React from "react";

const dmp = new diff_match_patch();

type SmartDiffProps = {
  oldValue: string;
  newValue: string;
  className?: string; // ✅ Added className prop
};

export const highlightDiffInHtml = (oldHtml: string, newHtml: string): string => {
  const oldRoot = parse(sanitize(oldHtml));
  const newRoot = parse(sanitize(newHtml));

  const processAddedNode = (node: any): string => {
    if (node.nodeType === 3) {
      // Text node
      return `<span class="diff-added">${node.text}</span>`;
    }
    const attributes = Object.entries(node.attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");
    const children = node.childNodes.map((child: any) => processAddedNode(child)).join("");
    return `<${node.rawTagName}${attributes ? " " + attributes : ""}>${children}</${node.rawTagName}>`;
  };

  const processRemovedNode = (node: any): string => {
    if (node.nodeType === 3) {
      // Text node
      return `<span class="diff-removed">${node.text}</span>`;
    }
    const attributes = Object.entries(node.attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");
    const children = node.childNodes.map((child: any) => processRemovedNode(child)).join("");
    return `<${node.rawTagName}${attributes ? " " + attributes : ""}>${children}</${node.rawTagName}>`;
  };

  const applyDiff = (oldNode: any, newNode: any): string => {
    // Handle text node diffing
    if (oldNode?.nodeType === 3 && newNode?.nodeType === 3) {
      const diffs = dmp.diff_main(oldNode.text, newNode.text);
      dmp.diff_cleanupSemantic(diffs);
      return diffs
        .map(([type, text]) => {
          if (type === 1) return `<span class="diff-added">${text}</span>`;
          if (type === -1) return `<span class="diff-removed">${text}</span>`;
          return text;
        })
        .join("");
    }

    // Handle structural changes
    if (!oldNode) return processAddedNode(newNode);
    if (!newNode) return processRemovedNode(oldNode);

    // Handle tag mismatch
    if (oldNode.rawTagName !== newNode.rawTagName) {
      return `${processRemovedNode(oldNode)}${processAddedNode(newNode)}`;
    }

    // Process matching tags
    const attributes = Object.entries(newNode.attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");

    const children = newNode.childNodes
      .map((newChild: any, i: number) => applyDiff(oldNode.childNodes[i], newChild))
      .join("");

    return `<${newNode.rawTagName}${attributes ? " " + attributes : ""}>${children}</${newNode.rawTagName}>`;
  };

  return applyDiff(oldRoot, newRoot);
};

const TextDiff: React.FC<SmartDiffProps> = ({ oldValue, newValue, className }) => {
  const diffs = dmp.diff_main(oldValue || "", newValue || "");
  dmp.diff_cleanupSemantic(diffs);

  return (
    <span className={className}>
      {diffs.map(([type, text], index) => {
        if (type === 0) return <span key={index}>{text}</span>; // Unchanged
        if (type === 1)
          return (
            <mark key={index} className="bg-green-100">
              {text}
            </mark>
          ); // Added
        if (type === -1)
          return (
            <s key={index} className="text-red-500/80">
              {text}
            </s>
          ); // Removed
        return null;
      })}
    </span>
  );
};

const HtmlDiff: React.FC<SmartDiffProps> = ({ oldValue, newValue, className }) => {
  const oldRoot = parse(oldValue || "");
  const newRoot = parse(newValue || "");

  const walk = (oldNode: any, newNode: any): React.ReactNode => {
    if (!oldNode || !newNode) return null;

    // Handle text nodes
    if (oldNode.nodeType === 3 && newNode.nodeType === 3) {
      return <TextDiff oldValue={oldNode.text} newValue={newNode.text} className={className} />;
    }

    // If both nodes are the same type, recursively compare their children
    if (oldNode.rawTagName === newNode.rawTagName) {
      return React.createElement(
        oldNode.rawTagName,
        { key: oldNode.rawTagName, className, ...oldNode.attrs }, // ✅ Apply className
        oldNode.childNodes.map((child: any, index: number) =>
          walk(child, newNode.childNodes[index] || {}),
        ),
      );
    }

    // Show removed and added differences
    return (
      <div className={className}>
        <div className="diff-removed">{oldNode.toString()}</div>
        <div className="diff-added">{newNode.toString()}</div>
      </div>
    );
  };

  return <div className={className}>{walk(oldRoot, newRoot)}</div>;
};

export const SmartDiff: React.FC<SmartDiffProps> = ({ oldValue, newValue, className }) => {
  if (/<[a-z][\S\s]*>/i.test(oldValue)) {
    return <HtmlDiff oldValue={oldValue} newValue={newValue} className={className} />;
  }

  return <TextDiff oldValue={oldValue} newValue={newValue} className={className} />;
};

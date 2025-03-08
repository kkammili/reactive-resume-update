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

  // Add this helper function to handle node wrapping
  const wrapNode = (node: any, content: string): string => {
    if (!node.rawTagName || node.rawTagName.toLowerCase() === 'null') {
      return content; // Skip invalid/null tags
    }
    const attributes = Object.entries(node.attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");
    return `<${node.rawTagName}${attributes ? " " + attributes : ""}>${content}</${node.rawTagName}>`;
  };

  const processAddedNode = (node: any): string => {
    if (node.nodeType === 3) {
      return `<span class="diff-added">${node.text}</span>`;
    }
    const children = node.childNodes.map((child: any) => processAddedNode(child)).join("");
    return wrapNode(node, children);
  };

  const processRemovedNode = (node: any): string => {
    if (node.nodeType === 3) {
      return `<span class="diff-removed">${node.text}</span>`;
    }
    const children = node.childNodes.map((child: any) => processRemovedNode(child)).join("");
    return wrapNode(node, children);
  };

  const applyDiff = (oldNode: any, newNode: any): string => {
    // Handle root document node
    if (oldNode?.nodeType === 9 || newNode?.nodeType === 9) {
      return applyDiff(
        oldNode?.nodeType === 9 ? oldNode.childNodes[0] : oldNode,
        newNode?.nodeType === 9 ? newNode.childNodes[0] : newNode
      );
    }

    // Existing diff logic
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

    if (!oldNode) return processAddedNode(newNode);
    if (!newNode) return processRemovedNode(oldNode);

    // Handle tag mismatch including null tags
    if ((oldNode.rawTagName || 'null') !== (newNode.rawTagName || 'null')) {
      return `${processRemovedNode(oldNode)}${processAddedNode(newNode)}`;
    }

    const children = newNode.childNodes
      .map((newChild: any, i: number) => applyDiff(oldNode.childNodes[i], newChild))
      .join("");

    return wrapNode(newNode, children);
  };

  // Start with first meaningful child node
  return applyDiff(
    oldRoot.nodeType === 9 ? oldRoot.childNodes[0] : oldRoot,
    newRoot.nodeType === 9 ? newRoot.childNodes[0] : newRoot
  );
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

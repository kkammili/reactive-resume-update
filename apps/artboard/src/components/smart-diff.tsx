import { diff_match_patch } from "diff-match-patch";
import { parse } from "node-html-parser";
import React from "react";
import './smartDiff.css';

const dmp = new diff_match_patch();

type SmartDiffProps = {
  oldValue: string;
  newValue: string;
  className?: string; // ✅ Added className prop
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
          walk(child, newNode.childNodes[index] || {})
        )
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

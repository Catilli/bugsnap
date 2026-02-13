'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ProjectMember {
  id: string;
  name: string;
  email: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string, mentionedUserIds: string[]) => void;
  projectMembers: ProjectMember[];
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export default function MentionTextarea({
  value,
  onChange,
  projectMembers,
  placeholder,
  rows = 3,
  disabled = false,
  autoFocus = false,
  className = '',
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionResults, setMentionResults] = useState<ProjectMember[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);

  // Track all inserted mentions: name -> userId
  const trackedMentionsRef = useRef<Map<string, string>>(new Map());

  const collectMentionedIds = useCallback((text: string): string[] => {
    const ids = new Set<string>();
    const regex = /@(\w+(?:\s\w+)*)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const name = match[1];
      const id = trackedMentionsRef.current.get(name);
      if (id) ids.add(id);
    }
    return [...ids];
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      const caretPos = e.target.selectionStart;
      const textBefore = text.slice(0, caretPos);
      const mentionMatch = textBefore.match(/@(\w*)$/);

      if (mentionMatch && projectMembers.length > 0) {
        const query = mentionMatch[1].toLowerCase();
        const startPos = caretPos - mentionMatch[0].length;
        const filtered = projectMembers
          .filter((m) => m.name.toLowerCase().includes(query))
          .slice(0, 5);

        setMentionStartPos(startPos);
        setMentionResults(filtered);
        setShowDropdown(filtered.length > 0);
        setSelectedIndex(0);
      } else {
        setShowDropdown(false);
        setMentionResults([]);
        setMentionStartPos(null);
      }

      onChange(text, collectMentionedIds(text));
    },
    [projectMembers, onChange, collectMentionedIds],
  );

  const insertMention = useCallback(
    (member: ProjectMember) => {
      const textarea = textareaRef.current;
      if (!textarea || mentionStartPos === null) return;

      const caretPos = textarea.selectionStart;
      const before = value.slice(0, mentionStartPos);
      const after = value.slice(caretPos);
      const inserted = `@${member.name} `;
      const newValue = before + inserted + after;

      // Track this mention
      trackedMentionsRef.current.set(member.name, member.id);

      setShowDropdown(false);
      setMentionResults([]);
      setMentionStartPos(null);

      onChange(newValue, collectMentionedIds(newValue));

      // Restore caret position after React re-renders
      const newCaretPos = mentionStartPos + inserted.length;
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newCaretPos, newCaretPos);
      });
    },
    [value, mentionStartPos, onChange, collectMentionedIds],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showDropdown || mentionResults.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % mentionResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + mentionResults.length) % mentionResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(mentionResults[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
      }
    },
    [showDropdown, mentionResults, selectedIndex, insertMention],
  );

  // Seed tracked mentions when value is set externally (edit mode)
  useEffect(() => {
    if (value && projectMembers.length > 0) {
      const regex = /@(\w+(?:\s\w+)*)/g;
      let match;
      while ((match = regex.exec(value)) !== null) {
        const name = match[1];
        const member = projectMembers.find(
          (m) => m.name.toLowerCase() === name.toLowerCase(),
        );
        if (member) {
          trackedMentionsRef.current.set(member.name, member.id);
        }
      }
    }
  }, [projectMembers]); // Only on initial mount / member list change

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        autoFocus={autoFocus}
        className={
          className ||
          'w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y text-sm'
        }
      />
      {showDropdown && mentionResults.length > 0 && (
        <div className="absolute bottom-full mb-1 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {mentionResults.map((member, i) => (
            <button
              key={member.id}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                i === selectedIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(member);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-gray-900 block truncate">{member.name}</span>
                <span className="text-gray-400 text-xs block truncate">{member.email}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

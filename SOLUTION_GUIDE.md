# Solution file guide (for writers)

Each problem gets ONE markdown file at `solutions/<id>.md` where `<id>` is the `id` field from the batch JSON.

Write ORIGINAL content in your own words. Do NOT copy text from takeuforward.org, LeetCode editorials, or any other site.

Exact template (keep the headings verbatim so the app can render them):

```markdown
# <Problem name exactly as in the batch JSON>

**Difficulty:** <Easy|Medium|Hard>  ·  **Topic:** <step> › <substep>

## Problem
2–5 sentences stating the task in your own words, with input/output. Include one small example (Input / Output lines).

## Approach 1: <name, e.g. Brute Force>
Explain the idea in short paragraphs or a numbered list (why it works, key observation).
- **Time:** O(...)
- **Space:** O(...)

## Approach 2: <name, e.g. Better / Optimal>
(Add as many approaches as are genuinely useful — usually brute → better → optimal. Theory items like "Input Output" or "Pattern 5" can have a single "## Approach" section explaining the concept or pattern logic.)
- **Time:** O(...)
- **Space:** O(...)

## Code (Optimal)

### C++
```cpp
// complete, compilable function/class (LeetCode-style signature when applicable)
```

### Java
```java
// same
```

### Python
```python
# same
```

## Key Takeaways
- 2–4 bullets: the pattern, the pitfall, the edge cases.
```

Rules:
- Code must be correct and self-contained (a function or class; include helper structs like ListNode/TreeNode only if you use them, as a comment saying they are the standard definitions).
- Keep prose tight: the whole file is typically 80–200 lines.
- For pattern-printing problems ("Pattern 1".."Pattern 22"), show the expected output for n=5 in a code block under ## Problem, then explain the loop logic and give the code.
- For pure theory items (e.g. "Input Output", "Cpp Basics", "Time and Space complexity", "Introduction to DP", "STL"), replace approaches with a concise tutorial-style explanation with short code snippets; still keep `## Problem` (rename its content to what the topic covers) and `## Key Takeaways`.
- Never leave a section empty and never write placeholders like TODO.

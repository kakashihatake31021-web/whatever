/**
 * TriGuide AI - High-Fidelity Mock & Demo Responses
 * Provides instant responses for live judging and zero-friction demos
 * without requiring an immediate Google Gemini API key.
 */

export const MOCK_DATA = {
  // Domain 1: Learn & Master Scenarios
  learn: {
    "recursion": {
      title: "Understanding Recursion in Python",
      content: `### 🎓 Understanding Recursion: The Russian Doll Metaphor

Recursion is simply a function that **calls itself** until it reaches a stopping condition called the **Base Case**.

#### 💡 The Core Mental Model:
Think of Russian nesting dolls (*Matryoshka*):
1. **Base Case**: The smallest solid doll that cannot be opened. You stop here.
2. **Recursive Step**: You open a doll, find a slightly smaller doll inside, and repeat the exact same opening action.

#### 🐍 Python Example: Factorial (n!)

\`\`\`python
def factorial(n):
    # 1. Base Case: stop when n reaches 1 or 0
    if n <= 1:
        return 1
    
    # 2. Recursive Case: n * factorial of (n - 1)
    return n * factorial(n - 1)

print(factorial(5)) # Output: 120 (5 * 4 * 3 * 2 * 1)
\`\`\`

#### ⚠️ Common Beginner Traps:
- **Stack Overflow / Maximum Recursion Depth**: Forgetting the base case causes an infinite loop until your memory crashes.
- **Redundant Work**: Fibonacci without memoization runs in exponential time $O(2^n)$.

#### 🧠 Quick Check Question:
*What happens if you run \`factorial(-1)\` in the code above?* 
(Hint: Look at the base case!)`
    },

    "event loop": {
      title: "The JavaScript Event Loop Explained",
      content: `### ⚡ The JavaScript Event Loop

JavaScript is **single-threaded** (it has only one Call Stack), but it feels multi-tasking because of the **Event Loop** and Web APIs!

#### 🔄 The 4 Key Actors:
1. **Call Stack**: Executes functions sequentially (LIFO).
2. **Web APIs / Node APIs**: Handles timers (\`setTimeout\`), network requests (\`fetch\`), and DOM events in the background.
3. **Microtask Queue**: Promises (\`.then()\`, \`async/await\`), \`queueMicrotask\`. *(Has highest priority!)*
4. **Macrotask Queue / Callback Queue**: \`setTimeout\`, \`setInterval\`, I/O events.

#### ⏱️ Mind-Bending Execution Example:

\`\`\`javascript
console.log('1. Start');

setTimeout(() => {
  console.log('2. Timeout callback (Macrotask)');
}, 0);

Promise.resolve().then(() => {
  console.log('3. Promise callback (Microtask)');
});

console.log('4. End');
\`\`\`

#### 🎯 Output:
\`\`\`
1. Start
4. End
3. Promise callback (Microtask)
2. Timeout callback (Macrotask)
\`\`\`

**Why?** The Event Loop will NEVER pick up tasks from queues until the Call Stack is completely empty, and it always drains the **Microtask Queue** before touching the Macrotask Queue!`
    },

    "pointers": {
      title: "Pointers & Memory in C++",
      content: `### 🎯 C++ Pointers Demystified

A variable stores a **value**. A **pointer** stores the **memory address** where that value lives in RAM!

#### 🔍 The Two Crucial Symbols:
- \`&\` (**Address-of operator**): "Where does this variable live?"
- \`*\` (**Dereference operator**): "Go to this address and fetch or modify the value!"

\`\`\`cpp
#include <iostream>

int main() {
    int score = 100;
    int* ptr = &score; // ptr now holds the RAM address of score (e.g., 0x7ffd9a)

    std::cout << "Value of score: " << score << std::endl;      // 100
    std::cout << "Address of score: " << &score << std::endl;   // 0x7ffd9a
    std::cout << "Pointer value: " << ptr << std::endl;         // 0x7ffd9a
    std::cout << "Dereferenced: " << *ptr << std::endl;        // 100

    // Modifying value via pointer:
    *ptr = 250;
    std::cout << "New score: " << score << std::endl;           // 250!
    return 0;
}
\`\`\`

#### 🛡️ Modern Best Practice:
In modern C++ (C++11 and later), avoid raw pointers where possible and prefer **Smart Pointers** (\`std::unique_ptr\`, \`std::shared_ptr\`) to prevent memory leaks!`
    }
  },

  // Domain 2: Debug & Fix Scenarios
  debug: {
    "typeerror": {
      title: "JavaScript TypeError: Cannot read property of undefined",
      buggyCode: `// Buggy User Profile Handler
function getUserDisplayName(user) {
  const firstName = user.profile.name.first;
  const lastName = user.profile.name.last;
  return firstName + " " + lastName;
}

// Fails when user is empty or profile is null!
const result = getUserDisplayName({});
console.log(result);`,
      fixedCode: `// Fixed User Profile Handler with Optional Chaining & Fallbacks
function getUserDisplayName(user) {
  // Safe navigation prevents crashing on undefined properties
  const firstName = user?.profile?.name?.first ?? "Guest";
  const lastName = user?.profile?.name?.last ?? "User";
  return \`\${firstName} \${lastName}\`.trim();
}

const result = getUserDisplayName({});
console.log(result); // Outputs: "Guest User"`,
      diagnosis: `🚨 **Root Cause**: The function assumes nested object properties (\`user.profile.name\`) always exist. When passed an empty object \`{}\`, accessing \`user.profile\` yields \`undefined\`, and trying to access \`.name\` on \`undefined\` immediately throws:
\`TypeError: Cannot read properties of undefined (reading 'name')\`.

🛠️ **The Fix**: 
1. Used **Optional Chaining** (\`?.\`) to safely short-circuit if any level is nullish.
2. Added the **Nullish Coalescing Operator** (\`??\`) to provide friendly fallback defaults.
3. Switched to template literals for cleaner string interpolation.`
    },

    "indexerror": {
      title: "Python IndexError: list index out of range",
      buggyCode: `# Buggy Search Loop
def find_adjacent_pairs(items):
    pairs = []
    # Off-by-one bug: items[i+1] will overflow on the last item!
    for i in range(len(items)):
        if items[i] == items[i + 1]:
            pairs.append(items[i])
    return pairs

nums = [1, 2, 2, 3, 4, 4]
print(find_adjacent_pairs(nums))`,
      fixedCode: `# Fixed Search Loop with Proper Bounds
def find_adjacent_pairs(items):
    pairs = []
    # Stop at len(items) - 1 so (i + 1) stays safely inside bounds
    for i in range(len(items) - 1):
        if items[i] == items[i + 1]:
            pairs.append(items[i])
    return pairs

nums = [1, 2, 2, 3, 4, 4]
print(find_adjacent_pairs(nums)) # Outputs: [2, 4]`,
      diagnosis: `🚨 **Root Cause**: Classic **Off-by-One error**. The loop iterated up to \`len(items) - 1\` as \`i\`, but line 6 accesses \`items[i + 1]\`. On the final iteration, \`i + 1\` equals \`len(items)\`, which does not exist in 0-indexed lists, raising \`IndexError: list index out of range\`.

🛠️ **The Fix**: 
1. Bound the loop to \`range(len(items) - 1)\`.
2. Alternatively in Python, you can write this idiomatically using \`zip(items, items[1:])\`.`
    },

    "memory_leak": {
      title: "C++ Memory Leak & Dangling Pointer",
      buggyCode: `#include <iostream>

int* createArray(int size) {
    int* arr = new int[size];
    for (int i = 0; i < size; i++) arr[i] = i * 2;
    return arr;
    // Memory never deallocated!
}

int main() {
    int* data = createArray(1000000);
    // Missing delete[] data;
    return 0;
}`,
      fixedCode: `#include <iostream>
#include <vector>
#include <memory>

// Modern C++: Use std::vector or std::unique_ptr to manage memory automatically (RAII)
std::vector<int> createArray(int size) {
    std::vector<int> arr(size);
    for (int i = 0; i < size; i++) {
        arr[i] = i * 2;
    }
    return arr; // Safe move semantics, automatically freed upon scope exit!
}

int main() {
    auto data = createArray(1000000);
    std::cout << "Created array with " << data.size() << " elements safely!\\n";
    return 0;
}`,
      diagnosis: `🚨 **Root Cause**: Memory allocated via \`new int[size]\` on the heap was never released with \`delete[]\`. Repeating this in long-running services leads to a critical **Memory Leak**.

🛠️ **The Fix**: 
1. Replaced manual heap management with modern C++ **RAII** (\`std::vector\`).
2. Guarantees zero memory leaks and automatic cleanup when going out of scope.`
    }
  },

  // Domain 3: Practice & Build Scenarios
  build: {
    "rest_api": {
      title: "Node.js Express REST API Boilerplate",
      content: `### 🚀 Production-Ready REST API with Express & Validation

Here is a clean, structured boilerplate for building an API with validation, routing, and error handling:

\`\`\`javascript
import express from 'express';

const app = express();
app.use(express.json());

// In-Memory Database Store for Demonstration
const tasks = [
  { id: 1, title: 'Learn Gemini API', done: true },
  { id: 2, title: 'Build TriGuide AI', done: false }
];

// GET /api/tasks - Retrieve all tasks
app.get('/api/tasks', (req, res) => {
  res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

// POST /api/tasks - Create new task with validation
app.post('/api/tasks', (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }

  const newTask = {
    id: tasks.length + 1,
    title: title.trim(),
    done: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  res.status(201).json({ success: true, data: newTask });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Server running on http://localhost:\${PORT}\`));
\`\`\`

#### 🧪 Test with cURL:
\`\`\`bash
curl -X POST http://localhost:3000/api/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Demo TriGuide AI to Hackathon Judges"}'
\`\`\``
    },

    "twosum": {
      title: "Two Sum: Optimal Hash Map Solution",
      content: `### 🧠 Challenge: Two Sum (LeetCode #1)

Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

#### 💡 Optimal Approach: Hash Map ($O(n)$ Time, $O(n)$ Space)
Instead of a slow brute force nested loop $O(n^2)$, store previously seen numbers and their index in a dictionary!

\`\`\`python
def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {} # value -> index
    
    for current_index, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], current_index]
        seen[num] = current_index
        
    return []

# Test execution:
nums = [2, 7, 11, 15]
target = 9
print(two_sum(nums, target)) # Output: [0, 1] (since 2 + 7 = 9)
\`\`\`

#### 📊 Complexity Analysis:
- **Time Complexity**: $\\mathcal{O}(n)$ — Single pass through the array.
- **Space Complexity**: $\\mathcal{O}(n)$ — Stores up to $n$ elements in the dictionary.`
    }
  }
};

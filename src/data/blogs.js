// Blog data focused on desugaring JavaScript syntactic sugar
const blogs = [
  {
    id: '1',
    slug: 'desugaring-arrow-functions',
    title: 'Desugaring Arrow Functions',
    excerpt: 'Understand what arrow functions really are by converting them back to traditional function expressions',
    author: 'Unsugar Team',
    publishedDate: '2024-01-15',
    readTime: '7 min read',
    tags: ['ES6', 'Functions', 'Lexical this'],
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&q=80',
    content: `# Desugaring Arrow Functions

Arrow functions are syntactic sugar that provide a shorter syntax for writing functions. But what do they really do under the hood?

## The Sugar: Arrow Functions

\`\`\`javascript
// Arrow function
const greet = (name) => {
  return \`Hello, \${name}!\`;
};

// Even shorter with implicit return
const add = (a, b) => a + b;
\`\`\`

## The Desugared Version

Arrow functions are essentially function expressions with a key difference: lexical \`this\` binding.

\`\`\`javascript
// Desugared: Regular function expression
const greet = function(name) {
  return \`Hello, \${name}!\`;
};

const add = function(a, b) {
  return a + b;
};
\`\`\`

## The Critical Difference: Lexical \`this\`

The real magic of arrow functions isn't just shorter syntax—it's how they handle \`this\`.

### With Arrow Functions (Sugar):

\`\`\`javascript
const obj = {
  name: 'Alice',
  friends: ['Bob', 'Charlie'],
  printFriends: function() {
    this.friends.forEach(friend => {
      console.log(\`\${this.name} knows \${friend}\`);
    });
  }
};
\`\`\`

### Desugared Without Arrow Functions:

\`\`\`javascript
const obj = {
  name: 'Alice',
  friends: ['Bob', 'Charlie'],
  printFriends: function() {
    const self = this; // Capture 'this' in a variable
    this.friends.forEach(function(friend) {
      console.log(\`\${self.name} knows \${friend}\`);
    });
  }
};
\`\`\`

## Core Concept: Lexical Scope

Arrow functions don't have their own \`this\` binding. They inherit \`this\` from their enclosing lexical context. This is equivalent to capturing \`this\` in a variable before ES6.

## When NOT to Use Arrow Functions

Understanding the desugared version helps you know when arrow functions are inappropriate:

\`\`\`javascript
// BAD: Arrow function as method
const obj = {
  name: 'Alice',
  greet: () => {
    console.log(\`Hello, I'm \${this.name}\`); // 'this' is undefined!
  }
};

// GOOD: Regular function
const obj = {
  name: 'Alice',
  greet: function() {
    console.log(\`Hello, I'm \${this.name}\`);
  }
};
\`\`\`

## Summary

**Arrow Function Sugar:**
- Shorter syntax
- Implicit returns for single expressions
- Lexical \`this\` binding

**Desugared Equivalent:**
- Regular function expression
- Explicit returns
- Manual \`this\` capture via \`const self = this\`

Understanding this desugaring helps you make informed decisions about when to use arrow functions!
`
  },
  {
    id: '2',
    slug: 'desugaring-class-syntax',
    title: 'Desugaring ES6 Classes',
    excerpt: 'Classes are just syntactic sugar over prototypes. Let\'s see what they really compile down to',
    author: 'Unsugar Team',
    publishedDate: '2024-01-20',
    readTime: '10 min read',
    tags: ['ES6', 'Classes', 'Prototypes'],
    thumbnail: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&q=80',
    content: `# Desugaring ES6 Classes

ES6 classes look like traditional OOP, but they're just sugar over JavaScript's prototype system. Let's desugar them!

## The Sugar: Class Syntax

\`\`\`javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(\`\${this.name} makes a sound\`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }

  speak() {
    console.log(\`\${this.name} barks!\`);
  }
}
\`\`\`

## The Desugared Version: Prototypes

\`\`\`javascript
// Animal "class" - just a constructor function
function Animal(name) {
  this.name = name;
}

// Methods go on the prototype
Animal.prototype.speak = function() {
  console.log(this.name + ' makes a sound');
};

// Dog "class" - another constructor
function Dog(name, breed) {
  // super() call becomes explicit parent constructor call
  Animal.call(this, name);
  this.breed = breed;
}

// Inheritance: Set up prototype chain
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

// Override method
Dog.prototype.speak = function() {
  console.log(this.name + ' barks!');
};
\`\`\`

## Core Concepts Explained

### 1. Constructor Functions

Classes are just constructor functions:

\`\`\`javascript
// Sugar
class Person {
  constructor(name) {
    this.name = name;
  }
}

// Desugared
function Person(name) {
  this.name = name;
}
\`\`\`

### 2. Methods on Prototype

Instance methods are added to the prototype:

\`\`\`javascript
// Sugar
class Person {
  greet() {
    return \`Hi, I'm \${this.name}\`;
  }
}

// Desugared
Person.prototype.greet = function() {
  return 'Hi, I\\'m ' + this.name;
};
\`\`\`

### 3. Inheritance via Prototype Chain

\`extends\` sets up the prototype chain:

\`\`\`javascript
// Sugar
class B extends A {}

// Desugared - two key steps:
// 1. Instance properties inheritance
B.prototype = Object.create(A.prototype);
// 2. Fix constructor reference
B.prototype.constructor = B;
// 3. Static inheritance (bonus)
Object.setPrototypeOf(B, A);
\`\`\`

### 4. Super Calls

\`super()\` is just calling the parent constructor:

\`\`\`javascript
// Sugar
class Child extends Parent {
  constructor(x, y) {
    super(x);
    this.y = y;
  }
}

// Desugared
function Child(x, y) {
  Parent.call(this, x); // super(x)
  this.y = y;
}
\`\`\`

## Static Methods

\`\`\`javascript
// Sugar
class MathUtils {
  static add(a, b) {
    return a + b;
  }
}

// Desugared - static methods go directly on constructor
function MathUtils() {}
MathUtils.add = function(a, b) {
  return a + b;
};
\`\`\`

## Why This Matters

Understanding the desugared version reveals:

1. **Classes don't create a new type system** - They use existing prototypes
2. **No "true" privacy** - All properties are still accessible
3. **\`this\` still behaves the same** - It's based on how the function is called
4. **Prototype chain is the real mechanism** - Classes just make it easier to write

## Testing Both Versions

\`\`\`javascript
// Both work identically:
const dog1 = new Dog('Buddy', 'Golden Retriever');
dog1.speak(); // "Buddy barks!"

console.log(dog1 instanceof Dog);    // true
console.log(dog1 instanceof Animal); // true
console.log(dog1.__proto__ === Dog.prototype); // true
\`\`\`

## Summary

**Class Syntax (Sugar):**
- Cleaner, more familiar to OOP programmers
- \`constructor\`, \`extends\`, \`super\` keywords
- Static methods with \`static\` keyword

**Desugared (Core Concepts):**
- Constructor functions
- Prototype object for methods
- Manual prototype chain setup
- Explicit parent constructor calls with \`.call()\`

Classes don't change how JavaScript works—they just make prototypal inheritance easier to write and read!
`
  },
  {
    id: '3',
    slug: 'desugaring-async-await',
    title: 'Desugaring Async/Await',
    excerpt: 'Async/await is beautiful syntax, but it\'s built on Promises. Let\'s see the transformation',
    author: 'Unsugar Team',
    publishedDate: '2024-01-25',
    readTime: '12 min read',
    tags: ['ES2017', 'Async', 'Promises'],
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
    content: `# Desugaring Async/Await

Async/await makes asynchronous code look synchronous. But underneath, it's all Promises and state machines!

## The Sugar: Async/Await

\`\`\`javascript
async function fetchUserData(userId) {
  const user = await fetch(\`/api/users/\${userId}\`);
  const userData = await user.json();
  return userData;
}

// Usage
try {
  const data = await fetchUserData(123);
  console.log(data);
} catch (error) {
  console.error('Failed:', error);
}
\`\`\`

## The Desugared Version: Promises

\`\`\`javascript
function fetchUserData(userId) {
  return fetch(\`/api/users/\${userId}\`)
    .then(function(user) {
      return user.json();
    })
    .then(function(userData) {
      return userData;
    });
}

// Usage
fetchUserData(123)
  .then(function(data) {
    console.log(data);
  })
  .catch(function(error) {
    console.error('Failed:', error);
  });
\`\`\`

## Core Concept: State Machine

Async/await is actually a state machine that pauses and resumes execution. Here's a simplified mental model:

\`\`\`javascript
// Sugar
async function example() {
  const a = await promise1();
  const b = await promise2(a);
  return b;
}

// Conceptual desugaring (simplified)
function example() {
  return promise1()
    .then(function(a) {
      return promise2(a);
    })
    .then(function(b) {
      return b;
    });
}
\`\`\`

## Async Functions Return Promises

An \`async\` function **always** returns a Promise:

\`\`\`javascript
// Sugar
async function getValue() {
  return 42;
}

// Equivalent to:
function getValue() {
  return Promise.resolve(42);
}

// Both work the same:
getValue().then(value => console.log(value)); // 42
\`\`\`

## Error Handling Transformation

\`try/catch\` with await becomes \`.catch()\`:

\`\`\`javascript
// Sugar
async function handleErrors() {
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Desugared
function handleErrors() {
  return riskyOperation()
    .then(function(result) {
      return result;
    })
    .catch(function(error) {
      console.error('Error:', error);
      return null;
    });
}
\`\`\`

## Sequential vs Parallel

Understanding the desugaring helps with performance:

\`\`\`javascript
// Sequential (slower) - awaits are desugared to chained .then()
async function sequential() {
  const a = await fetchA(); // Waits
  const b = await fetchB(); // Then waits
  return [a, b];
}

// Desugared - shows why it's sequential
function sequential() {
  return fetchA()
    .then(function(a) {
      return fetchB()
        .then(function(b) {
          return [a, b];
        });
    });
}

// Parallel (faster) - start promises simultaneously
async function parallel() {
  const [a, b] = await Promise.all([fetchA(), fetchB()]);
  return [a, b];
}

// Desugared
function parallel() {
  return Promise.all([fetchA(), fetchB()])
    .then(function(results) {
      return results;
    });
}
\`\`\`

## Top-Level Await

Even top-level await is sugar:

\`\`\`javascript
// Sugar (in ES modules)
const data = await fetch('/api/data');

// Desugared (what the module system does)
(async function() {
  const data = await fetch('/api/data');
  // Rest of module code...
})();
\`\`\`

## Real-World Example

\`\`\`javascript
// Sugar: Clean async/await
async function processUser(id) {
  const user = await db.getUser(id);
  const posts = await db.getUserPosts(user.id);
  const enrichedPosts = await Promise.all(
    posts.map(post => enrichPost(post))
  );
  return { user, posts: enrichedPosts };
}

// Desugared: Promise chain
function processUser(id) {
  return db.getUser(id)
    .then(function(user) {
      return db.getUserPosts(user.id)
        .then(function(posts) {
          return Promise.all(
            posts.map(function(post) {
              return enrichPost(post);
            })
          )
          .then(function(enrichedPosts) {
            return { user: user, posts: enrichedPosts };
          });
        });
    });
}
\`\`\`

## Why Async/Await Exists

The desugared version shows why async/await was added:

1. **Readability** - Looks like synchronous code
2. **Error handling** - \`try/catch\` instead of nested \`.catch()\`
3. **Debugging** - Easier to step through in debuggers
4. **Avoid callback hell** - No deeply nested \`.then()\` chains

## Summary

**Async/Await (Sugar):**
- Synchronous-looking asynchronous code
- \`async\` functions return Promises automatically
- \`await\` pauses execution until Promise resolves
- \`try/catch\` for error handling

**Desugared (Core Concepts):**
- Promise chains with \`.then()\`
- Explicit \`Promise.resolve()\` wrapping
- Nested \`.then()\` calls for sequential operations
- \`.catch()\` for error handling

Understanding this transformation helps you write better async code and debug Promise issues more effectively!
`
  },
  {
    id: '4',
    slug: 'desugaring-destructuring',
    title: 'Desugaring Destructuring Assignment',
    excerpt: 'Destructuring is convenient but what\'s really happening? Let\'s break it down to basic property access',
    author: 'Unsugar Team',
    publishedDate: '2024-02-01',
    readTime: '9 min read',
    tags: ['ES6', 'Destructuring', 'Assignment'],
    thumbnail: 'https://images.unsplash.com/photo-1555952494-efd681c7e3f9?w=800&q=80',
    content: `# Desugaring Destructuring Assignment

Destructuring makes extracting values elegant. But it's just shorthand for property access and array indexing!

## Object Destructuring

### The Sugar

\`\`\`javascript
const person = { name: 'Alice', age: 30, city: 'NYC' };
const { name, age } = person;
console.log(name); // 'Alice'
console.log(age);  // 30
\`\`\`

### The Desugared Version

\`\`\`javascript
const person = { name: 'Alice', age: 30, city: 'NYC' };
const name = person.name;
const age = person.age;
console.log(name); // 'Alice'
console.log(age);  // 30
\`\`\`

## Array Destructuring

### The Sugar

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];
const [first, second, , fourth] = numbers;
console.log(first);  // 1
console.log(second); // 2
console.log(fourth); // 4
\`\`\`

### The Desugared Version

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];
const first = numbers[0];
const second = numbers[1];
// Skip index 2
const fourth = numbers[3];
console.log(first);  // 1
console.log(second); // 2
console.log(fourth); // 4
\`\`\`

## Default Values

### The Sugar

\`\`\`javascript
const { name, age = 25 } = { name: 'Bob' };
console.log(age); // 25 (default used)
\`\`\`

### The Desugared Version

\`\`\`javascript
const obj = { name: 'Bob' };
const name = obj.name;
const age = obj.age !== undefined ? obj.age : 25;
console.log(age); // 25
\`\`\`

## Renaming Properties

### The Sugar

\`\`\`javascript
const { name: userName, age: userAge } = person;
console.log(userName); // 'Alice'
console.log(userAge);  // 30
\`\`\`

### The Desugared Version

\`\`\`javascript
const userName = person.name;
const userAge = person.age;
console.log(userName); // 'Alice'
console.log(userAge);  // 30
\`\`\`

## Nested Destructuring

### The Sugar

\`\`\`javascript
const user = {
  id: 1,
  profile: {
    name: 'Alice',
    address: {
      city: 'NYC'
    }
  }
};

const { profile: { name, address: { city } } } = user;
console.log(name); // 'Alice'
console.log(city); // 'NYC'
\`\`\`

### The Desugared Version

\`\`\`javascript
const user = {
  id: 1,
  profile: {
    name: 'Alice',
    address: {
      city: 'NYC'
    }
  }
};

const name = user.profile.name;
const city = user.profile.address.city;
console.log(name); // 'Alice'
console.log(city); // 'NYC'
\`\`\`

## Rest Pattern

### The Sugar

\`\`\`javascript
const { name, ...rest } = { name: 'Alice', age: 30, city: 'NYC' };
console.log(name); // 'Alice'
console.log(rest); // { age: 30, city: 'NYC' }
\`\`\`

### The Desugared Version

\`\`\`javascript
const obj = { name: 'Alice', age: 30, city: 'NYC' };
const name = obj.name;

// Create new object with remaining properties
const rest = {};
for (const key in obj) {
  if (key !== 'name') {
    rest[key] = obj[key];
  }
}
console.log(name); // 'Alice'
console.log(rest); // { age: 30, city: 'NYC' }
\`\`\`

## Function Parameters

### The Sugar

\`\`\`javascript
function greet({ name, age = 18 }) {
  console.log(\`\${name} is \${age} years old\`);
}

greet({ name: 'Alice', age: 30 });
\`\`\`

### The Desugared Version

\`\`\`javascript
function greet(obj) {
  const name = obj.name;
  const age = obj.age !== undefined ? obj.age : 18;
  console.log(name + ' is ' + age + ' years old');
}

greet({ name: 'Alice', age: 30 });
\`\`\`

## Swapping Variables

### The Sugar

\`\`\`javascript
let a = 1;
let b = 2;
[a, b] = [b, a];
console.log(a); // 2
console.log(b); // 1
\`\`\`

### The Desugared Version

\`\`\`javascript
let a = 1;
let b = 2;
const temp = [b, a];
a = temp[0];
b = temp[1];
console.log(a); // 2
console.log(b); // 1
\`\`\`

## Core Concepts

1. **Property Access**: Object destructuring is just property access
2. **Array Indexing**: Array destructuring is just index access
3. **Conditional Assignment**: Defaults use ternary operators
4. **Iteration**: Rest patterns use loops to collect remaining properties

## Why This Matters

Understanding the desugared version helps you:

- Debug destructuring errors (e.g., "Cannot destructure undefined")
- Understand performance implications
- Write polyfills for older browsers
- Know what's actually happening with complex patterns

## Summary

**Destructuring (Sugar):**
- Concise variable extraction
- Default values
- Nested patterns
- Rest/spread syntax

**Desugared (Core Concepts):**
- Explicit property/index access
- Ternary operators for defaults
- Multiple assignment statements
- Loops for rest patterns

Destructuring doesn't add new capabilities—it just makes the code more readable and less repetitive!
`
  },
  {
    id: '5',
    slug: 'desugaring-template-literals',
    title: 'Desugaring Template Literals',
    excerpt: 'Template literals transform into string concatenation with special handling for expressions',
    author: 'Unsugar Team',
    publishedDate: '2024-02-05',
    readTime: '8 min read',
    tags: ['ES6', 'Strings', 'Interpolation'],
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    content: `# Desugaring Template Literals

Template literals provide string interpolation and multi-line strings. Let's see what they compile to!

## Basic Template Literals

### The Sugar

\`\`\`javascript
const name = 'Alice';
const age = 30;
const message = \`Hello, my name is \${name} and I am \${age} years old.\`;
console.log(message);
\`\`\`

### The Desugared Version

\`\`\`javascript
const name = 'Alice';
const age = 30;
const message = 'Hello, my name is ' + name + ' and I am ' + age + ' years old.';
console.log(message);
\`\`\`

## Multi-Line Strings

### The Sugar

\`\`\`javascript
const poem = \`
  Roses are red,
  Violets are blue,
  Template literals,
  Make code readable too.
\`;
\`\`\`

### The Desugared Version

\`\`\`javascript
const poem = '\\n' +
  '  Roses are red,\\n' +
  '  Violets are blue,\\n' +
  '  Template literals,\\n' +
  '  Make code readable too.\\n';
\`\`\`

## Expression Evaluation

### The Sugar

\`\`\`javascript
const a = 5;
const b = 10;
const result = \`The sum of \${a} and \${b} is \${a + b}.\`;
console.log(result); // "The sum of 5 and 10 is 15."
\`\`\`

### The Desugared Version

\`\`\`javascript
const a = 5;
const b = 10;
const result = 'The sum of ' + a + ' and ' + b + ' is ' + (a + b) + '.';
console.log(result); // "The sum of 5 and 10 is 15."
\`\`\`

## Tagged Template Literals

This is where it gets interesting!

### The Sugar

\`\`\`javascript
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    return result + str + (values[i] ? \`<mark>\${values[i]}</mark>\` : '');
  }, '');
}

const name = 'Alice';
const city = 'NYC';
const html = highlight\`User \${name} lives in \${city}\`;
// "User <mark>Alice</mark> lives in <mark>NYC</mark>"
\`\`\`

### The Desugared Version

\`\`\`javascript
function highlight(strings, ...values) {
  return strings.reduce(function(result, str, i) {
    return result + str + (values[i] ? '<mark>' + values[i] + '</mark>' : '');
  }, '');
}

const name = 'Alice';
const city = 'NYC';
// Tagged template compiles to a function call with special arguments
const html = highlight(
  ['User ', ' lives in ', ''], // Array of string parts
  name,                         // First interpolated value
  city                          // Second interpolated value
);
\`\`\`

## Core Concept: Array of Strings + Values

Tagged templates pass:
1. An array of string literals
2. The interpolated values as separate arguments

\`\`\`javascript
// Sugar
tag\`a \${x} b \${y} c\`;

// Desugared
tag(['a ', ' b ', ' c'], x, y);
\`\`\`

## Raw Strings

### The Sugar

\`\`\`javascript
function showRaw(strings) {
  console.log(strings.raw[0]);
}

showRaw\`Line 1\\nLine 2\`;
// Prints: "Line 1\\nLine 2" (raw string, not "Line 1\nLine 2")
\`\`\`

### The Desugared Concept

The \`.raw\` property contains strings with escape sequences NOT processed:

\`\`\`javascript
const strings = ['Line 1\\nLine 2'];
strings.raw = ['Line 1\\\\nLine 2']; // Backslashes preserved
\`\`\`

## Nested Templates

### The Sugar

\`\`\`javascript
const items = ['apple', 'banana', 'orange'];
const list = \`
  <ul>
    \${items.map(item => \`<li>\${item}</li>\`).join('')}
  </ul>
\`;
\`\`\`

### The Desugared Version

\`\`\`javascript
const items = ['apple', 'banana', 'orange'];
const list = '\\n  <ul>\\n    ' +
  items.map(function(item) {
    return '<li>' + item + '</li>';
  }).join('') +
  '\\n  </ul>\\n';
\`\`\`

## Performance Considerations

Understanding the desugaring reveals performance:

\`\`\`javascript
// Multiple concatenations
const result = \`\${a}\${b}\${c}\${d}\`;

// Desugared - shows the cost
const result = '' + a + b + c + d;

// Sometimes more explicit is clearer
const result = [a, b, c, d].join('');
\`\`\`

## Common Use Cases

### HTML Generation

\`\`\`javascript
// Sugar
const html = \`<div class="user">\${user.name}</div>\`;

// Desugared
const html = '<div class="user">' + user.name + '</div>';
\`\`\`

### SQL Queries (with safety in mind!)

\`\`\`javascript
// Sugar (DON'T DO THIS - SQL injection risk!)
const query = \`SELECT * FROM users WHERE id = \${userId}\`;

// Better: Use tagged template for safety
const query = sql\`SELECT * FROM users WHERE id = \${userId}\`;
// The 'sql' tag can escape values properly
\`\`\`

## Summary

**Template Literals (Sugar):**
- Backticks for string delimiters
- \`\${expression}\` for interpolation
- Multi-line strings without escaping
- Tagged templates for processing

**Desugared (Core Concepts):**
- String concatenation with \`+\`
- Explicit \`\\n\` for newlines
- Function calls with arrays for tagged templates
- All expressions evaluated and coerced to strings

Template literals don't change how strings work—they just make string composition more readable!

## Why This Matters

1. **Debugging**: Understand what gets evaluated and when
2. **Performance**: Know the cost of complex interpolations
3. **Security**: Realize why you need sanitization
4. **Polyfills**: Understand how transpilers convert your code

Template literals are powerful sugar that makes string handling much more pleasant while building on JavaScript's existing string primitives!
`
  }
];

module.exports = blogs;

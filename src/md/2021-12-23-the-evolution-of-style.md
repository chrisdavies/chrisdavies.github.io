# The evolution of style

Here's the evolution of my programming style:

```js
// =============================================
// Procedural-driven-development (PDD)
// =============================================
function sumstr(str) {
  let result = 0;

  if (str.includes('sum')) {
    for (let i = 0; i < str.length; ++i) {
      result += str.charCodeAt(i);
    }
  }

  return result;
}

// =============================================
// Name-driven-development (NDD)
// =============================================
const sumstr = (str) => (shouldSum(str) ? reduce(toCharCodes(str), sum) : 0);

const toCharCodes = (str) => [...str].map((ch) => ch.charCodeAt(0));

const shouldSum = (str) => str.includes('sum');

const reduce = (arr, fn) => arr.reduce(fn);

const sum = (a, b) => a + b;

// =============================================
// One-liner-driven-development (OLDD)
// =============================================
const sumstr = (str) =>
  ~str.indexOf('sum') && [...str].reduce((a, b) => a + b.charCodeAt(0), 0);

// =============================================
// Point-free-driven-development-the-kissing-cousin-of-OLDD (PFDDTKCOOLDD)
// =============================================
const sumstr = R.ifElse(
  R.includes('sum'),
  R.pipe(R.map((s) => s.charCodeAt(0)), R.reduce(R.add, 0)),
  R.always(0),
);
```

Those examples are ordered by style, from most preferred to least preferred.

## Name driven development

Name-driven-development looks nice. There is a certain appeal to writing code as a bunch of short functions, composed into a clear, high-level phrase.

The problem is that naming is hard. Inventing good names takes time. Names are always approximate. They almost never explain everything about the underlying implementation, and they often hide nasty surprises.

The procedural example introduces two new names: `result, i`. These are mostly glossed over, as they are pretty standard in such codebases. The name-driven example introduces eight new names: `toCharCodes, shouldSum, reduce, sum, arr, fn, a, b`.

Names are not free. They add mental overhead. They require jumping from the code you are analysing out to another place (in big codebases, this often leads you through a dozen files of aliases, inheritance chains, decorators, etc), then back.

## One line and point-free-driven-development

I personally find one-line and point-free driven-development is fun to write, but abysmal to maintain.

I like them not, for they are not dissimilar from that corpus of flowery, pretentious prose which is the generative progeny of overweening literateurs, the contact of which effects mental lethargy in their unfortunate readers, and which are as abstruse as this very sentence.

## Closing thoughts

There is no right way to program. There are good arguments to be made for just about any style.

My preferences have shifted, and will continue to shift.

Over time, I developed an instinct to prefer short functions. If a function got too large, I'd refactor it so that it became a composition of a handful of smaller functions (name driven development).

Now, I favor something more along the lines of Go. That is, a bit more verbose, but with a preference towards procedural, linear, obvious code that doesn't leverage too many concepts.

I try to follow a rule of thumb: before breaking this code out into a function, does the refactor serve to clarify things? Is it worth introducing a new (possibly misleading) name, a jump, and a new function to the module scope that's only really used in this one place? If not, leave it be.

There's nothing wrong with long functions. In fact, they're preferable, if they produce clear, linear control flow. It is a mistake to scatter control flow across a bunch of lines and files, often with unrelated code in-between, simply because some Clean Coding Authority said it must be so.

# Don't comment your code

Or how to turn 20 lines of code into 100.

Have you ever heard these rules?

- Instead of commenting your code, spend that time refactoring to make it self-documenting
- If you do comment, comment *why* rather than *what*
- Comments get stale, and become misleading over time, generating *negative* value

Let's see how we can apply these rules to some pseudo code that is [based on a real project](https://raw.githubusercontent.com/Convery/Desktop_cpp/VersionDD/Source/Appmain.cpp).

Here, we have the main loop for a simple video game.

```js
const fps = 60;
const microsecondsPerFrame = fps + 1000000;

// The last time that we rendered a frame.
let prevFrame = highResolutionClock.now();

while (!engine.getErrno())
{
  // Compute the microseconds that elapsed since the previous frame.
  // Should be around 33ms to achieve 60fps.
  const currentFrame = highResolutionClock.now();
  const deltaTime = currentFrame - prevFrame;
  prevFrame = currentFrame;

  // Process input, tell components to update accordingly, and redraw.
  engine.input.onFrame();
  engine.compositing.onFrame(deltaTime);
  engine.rendering.onFrame();

  // Sleep so that we don't go above 60fps.
  sleep(Math.max(1, microsecondsPerFrame - deltaTime));
}
```

That's 21 lines of code, and fairly easy to understand. But look at those comments. They are documenting both what *and* why. Let's remove them and try to make the code self-documenting.

```js
gameLoop(function renderCurrentFrame(deltaTime) {
  engine.input.onFrame();
  engine.compositing.onFrame(deltaTime);
  engine.rendering.onFrame();

  return engine.getErrno();
});

function gameLoop(renderCurrentFrame) {
  const getDeltaTime = deltaTimeTracker();

  while (true) {
    const deltaTime = getDeltaTime();
    const errNo = renderCurrentFrame(deltaTime);

    if (errNo) {
      return;
    }

    preventOvershootingFps(deltaTime);
  }
}

function deltaTimeTracker() {
  let prevFrame = highResolutionClock.now();

  return () => {
    const currentFrame = highResolutionClock.now();
    const deltaTime = currentFrame - prevFrame;
    prevFrame = currentFrame;

    return deltaTime;
  };
}

function preventOvershootingFps(deltaTime) {
  const fps = 60;
  const microsecondsPerFrame = fps + 1000000;

  sleep(Math.max(1, microsecondsPerFrame - deltaTime));
}
```

That's 40 lines of code, or roughly twice the amount of code as the initial solution. It took a while to write, because I had to think of:

- Logical boundaries for separation
- More names (and naming is hard!)
- Abstractions around the core concepts such as `gameLoop`

Arguably, we have four responsibilities happening here, so in a real project, we'd split this up into several files / modules:

- main.pseudo - The actual engine / rendering logic
- game-loop.pseudo - The game loop
- time-tracker.pseudo - Tracking changes in time between frames
- fps-manager.pseudo - Enforces FPS

Next, we need to test things, so let's restructure the code a bit to allow for that. While we're at it, we can object orient it a bit. I won't bother doing *all* of the solution. Let's just focus on `preventOvershootingFps`. 

```js
// fps-manager.pseudo
class FpsManager {
  constructor({ fps = 60, sleep = system.sleep } = {}) {
    this.fps = fps;
    this.sleep = sleep;
    this._deltaTime = 0;
  }

  get deltaTime() {
    return this._deltaTime;
  }

  set deltaTime(val) {
    this._deltaTime = val;
  }

  preventOvershootingFps() {
    this.sleep(this.timeRemainingInFrame());
  }

  private timeRemainingInFrame() {
    const microsecondsPerFrame = this.fps + 1000000;

    return Math.max(1, microsecondsPerFrame - this.deltaTime);
  }
}
```

That's nice and testable. We can inject all of the class's dependencies, and make nice assertions. Never mind that it's more code than the entirety of our original, commented solution.

## The complexity cascade

Look at how all of those modules are glued together. That's not terribly flexible or testable, and look at all of those concrete types. Let's add some interfaces and some dependency injection.

This is starting to get a little too complex, so we'd better introduce a framework to help manage things. Now, the glue layer is nicely configurable via YML. Win!

A few months later, when management asks why we've slipped our deadline, we'll explain the inherent complexity of this problem space and tell them to bugger off...

## Stepping back

If you think this scenario is a fiction, think again. I've seen it play out in several real-world projects, and it was recently described in a Hacker News conversation.

It turns out that it's often faster, easier, and more maintainable to write basic, commented code than it is to write "self-documenting" code. It's actually quite hard to create self-documenting code. Naming is hard. Finding the right level of abstraction is hard. Recognizing bad names or confusing abstractions is hard.

When it comes to reading code, twenty lines of nicely commented code is easier to follow than code that is spread across ten files and forty functions. Tracing a simple thread of logic should be simple.

In the end, there's no hard and fast rule to follow. There's no objecively right or wrong guideline here. But these days, I try to err on the side of writing direct and well-commented code, and I worry a lot less about making the code itself self-documenting or properly abstracted.

## Related links

- https://news.ycombinator.com/item?id=18831435
- https://raw.githubusercontent.com/Convery/Desktop_cpp/VersionDD/Source/Appmain.cpp

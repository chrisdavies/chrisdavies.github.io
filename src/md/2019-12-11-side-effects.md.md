# Side effects

I know someone who disassembled and reassmebled his car. This unusual activity was mandated by his dad as a prerequsite for getting a driver's license<sup><a href="#footnote1">[1]</a></sup>. When he was done, he had a screw left over. This made him a bit nervous. But, the car worked-- albeit with a few notable bugs. In order to turn on the headlights, you had to flip the windshield wiper lever. Things like that. This fellow eventually learned all of the peculiarities of the car and drove it as easily as you or I drive our cars. But imagine the poor sap who bought it from him years down the road!

Anyway, some of my recent work reminds me of this car. Code which appears to do one thing has some unexpected side-effects, and these side-effects hinder proper reasoning about the code.

Here's a modified example, taken from a word-procesor-like application:

```js
function buildPage(opts) {
  return {
    pageId: opts.newPageId(),
    title: 'Default title',
    body: 'Write something swank here.',
  };
}
```

At first glance, you'd assume this is a straighforward builder / helper function. You pass it an id generator, and it gives you back the default structure of a "page". Well, it turns out that `newPageId` does generate an id, but it also updates another component, which changes some state, which re-renders the React application.

This violates the principle of least surprise. It's the wrong behavior.

In this case, those other components don't care that you are *building* a new page. They only care that a new page is *added* to the system. Unfortunately, my application has no well-defined mechanism for notifying other components when a page is added, so instead, they are notified (and updated) when a new page is being built. Nevermind that you may not end up adding this new page to the system!

Calling the `buildPage` function in a loop might produce very poor performance or other undesirable (and maybe unpredictable) behavior:

```js
const newPages = range(1, 10).map(() => buildPage(opts));
```

A single snippet of surprising code won't make or break your application. But there is a non-linear combinatorial complexity to such snippets. Two complex, effectful functions produce more than double the complexity of one.

In [Elements of Clojure](https://www.lulu.com/shop/http://www.lulu.com/shop/zachary-tellman/elements-of-clojure/paperback/product-24261764.html), Zachary Tellman explains that all code is doing some combination of the following things:

- pulling data
- transforming data
- pushing data

And he notes that well-designed code knows which of these things it is doing. A process is code which composes all three: pull, transform, push. But within a process, code should be organized so that transformation logic is *only* transformation logic, and pulling logic is *only* pulling logic, etc. Another way of putting this is that software should be written with a [functional core and an imperative shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell).

I got this wrong in this particular codebase, even though I knew better<sup><a href="#footnote2">[2]</a></sup>.

So, how could we improve `buildPage`? First, the `newPageId` function should simply return a new ID. It may need to increment an internal numeric ID, or it may generate a GUID. Those details aren't relevant. But what it *shouldn't* do is udpate some other set of components or send a kill signal to a server process or robocall your mayor's office.

If some other component / process must update itself when new pages are added, that process should respond to the pages being *added*, not to the page structure being *built*.

Let's take a hypothetical component that needs to react to a page being added. Let's say it's a plugin which allows the user to specify a background color for any page, and the color should be whichever color the user last specified, so we can't simply compute a reasonable default when the page renders. We need to udpate our plugin's state as soon as a page is added.

One approach would be to use React's `useEffect` ~~footgun~~ hook<sup><a href="#footnote3">[3]</a></sup> for this purpose:

```js
function ColorChooser({ pageId, color, setState }) {
  useEffect(() => {
    if (!color) {
      setState(state => ({
        ...state,
        pageColors: {
          ...state.pageColors,
          [pageId]: getLastUsedColor(state),
        },
      }));
    }
  }, [pageId, color, setState]);

  return (<SomeThing />);
}
```

This is messy. There's highly state-specific stuff here. Using an action / dispatch mechanism would separate the "how" of assignment from the "what":

```js
function ColorChooser({ pageId, color, dispatch }) {
  useEffect(() => {
    if (!color) {
      dispatch({ type: 'ASSIGN_PAGE_COLOR', pageId });
    }
  }, [pageId, color, dispatch]);

  return (<SomeThing />);
}
```

Better, but we still have the real problem of conflating rendering with responding to state change events. And, what if we change our scrolling mechanism to be lazy so our page isn't always guaranteed to be rendered? Now, we're no longer predictably firing off these effects, and our page colors become non-deterministic. This solution is brittle.

Let's separate rendering from state changes by placing the state management responsibility in its own module and using rxjs to respond to state changes.

```js
// Respond to state changes in a well-defined module, using rxjs or similar
function pageColorAssigner({ state$, dispatch }) {
  // When our state changes...
  return state$.pipe(
    // Get the list of page ids which have no associated color
    map(state => difference(getPageIds(state), getColorIds(state))),
    filter(pageIds => pageIds.length > 0)
  ).subscribe(pageIds => dispatch({ type: 'ASSIGN_PAGE_COLORS', pageIds }));
};
```

This has a number of advantages over the previous code. Our render functions can now be pure React components: properties in, virtual dom out. Our state changes are isolated. We can test state changes in small units, rather than having to test them alongside the React component lifecycle.

The downside is, we've still got implicit side-effects hanging off of state changes. It might be nice to get rid of the implicitness of the side-effects. One way to do this would be to move to an explicit event-based system.

```js
// Respond to events in a well-defined module
function pageColorAssigner({ on, dispatch }) {
  return on('PAGE_ADD', ({ pageIds }) => dispatch({ type: 'ASSIGN_PAGE_COLORS', pageIds }));
};
```

Here, we've changed from a system which reacts to state changes to one which emits and subscribes to explicit events. We can instrument and diagnose things a bit more clearly. Answering the question, "Why did this page color action get dispatched?" would be more straighforward here, since the event subscription system could be told to log its events, and we'd see that the `'ASSIGN_PAGE_COLORS'` dispatch happened while emitting the `'PAGE_ADD'` event. There are likely to be additional benefits to being forced to think in a structured way about what kinds of events the system should emit and how they should be processed and controlled vs ad-hoc reactions to state changes.

An event system has one primary disadvantage vs an observable system, and that is, it reduces the flexibility offered to subscribers. With something like rxjs, I can easily compose rules, such as "When any of these five things change, do X". This composition is powerful. With a pub/sub event system, you have to hope that the system emits the right kinds of events in order for you to respond appropriately to the changes you are interested in.

I'm not sure which is preferable. Most of my old Windows applications followed a well-defined event emitter / subscriber system. I suspect that something like rxjs is a reasonable balance between the insanity of managing state via React hooks vs the rigidity of managing state through a structured event system.

One thing is certain. Effects and state management should be cordoned off and controlled<sup><a href="#footnote4">[4]</a></sup>.

### Footnotes

<a id="footnote1" href="#footnote1">[1]</a> Self-sufficiency was taken to a whole other level in that America.

<a id="footnote2" href="#footnote2">[2]</a> This is evident when you try to follow the flow of state through my application. Setting state, reacting to events, transforming state, and pulling / pushing data are responsibilities that are scattered throughout the UI components. They *should* be located in state management modules and the like.

The cleanest React applications keep all (or almost all) state at the root. Changes to that state are done in a controlled, systematic, and testable manner. The state itself is kept shallow. Pulling and pushing are done as actions or effects which reside in data-specific modules (see ClojureScript's re-frame for an interesting implementation). React components are a pure function of their inputs (a transform in Mr. Tellman's parlance).

<a id="footnote3" href="#footnote3">[3]</a> My application makes liberal use of the `useEffect` React hook. As the name suggests, this function's primary purpose is to serve as a footgun.

The `useEffect` hook makes a component more than a function of its input. It becomes something like a process. It's stateful, tracking changes across function (render) invocations. It's effectful (performing a pull or push and usually both), and it is still a transform (transforming its properties into VDOM nodes).

The very *last* thing you want to do is to scatter push, pull, and state transformatioon logic throughout the various components of your UI. Asking yourself, "How did I get into this state?" becomes more challenging than it ought. Tracking down race conditions becomes harder. Optimizing and deduplicating work becomes harder. Your application's flow of data becomes a non-linear, convoluted, often circular process.

In the case of my application, I would set a bit of state, and React would re-render, and one (or more) effects would fire off, and then *they* would set a bit of state, which would cause React to re-render, which might fire off even more effects, etc.

For React applications, I would suggest that the existence of `useEffect` is a code-smell. It indicates a deficiency in your architecture which forced you to reach for a complex and brittle workaround.

<a id="footnote4" href="#footnote4">[4]</a> In reflecting on this, some other rules of thumb came to mind:

- Effectful code should be explicit and avoided as much as possible
- In React, setState conflates what with how, and its use generally intersperses state manipulation logic throughout your application
- Something like an event-based (or action dispatch / reducer) pattern keeps UI components only concerned with "what" not "how"
- A UI component should be a pure transform from input (parameters) to output (UI elements)
- A UI component should hook up UI events to the larger system by dispatching actions / emitting events through a well-defined mechanism
- A UI component should not be effectful (push or pull data to / from a server, to / from a browser API, etc)
- The root of your application should serve as the integration point, knitting together all of the simpler UI components, the data / effects layer, initialization, etc
- This root is probably best tested with integration tests, rather than with too-heavy unit testing (which would necessarily involve many mocks)

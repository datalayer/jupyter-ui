---
title: React.js at Jupyter
authors: Eric Charles (@echarles)
issue-number: <pre-proposal-issue-number>
pr-number: <proposal-pull-request-number>
date-started: 2022-02-08
---

> JEP for React.js at Jupyter

This is a draft content related to `React.js at Jupyter` based on the official [template](https://github.com/jupyter/enhancement-proposals/blob/master/jupyter-enhancement-proposal-guidelines/JEP-TEMPLATE.md) aimed to be submitted as a JEP (Jupyter Enhancement Proposal).

We welcome contributors and reviewers in this early inception phase. More information on the JEP process can be read on:

- [Guidelines](https://jupyter.org/enhancement-proposals/jupyter-enhancement-proposal-guidelines/jupyter-enhancement-proposal-guidelines.html)
- [Repo](https://github.com/jupyter/enhancement-proposals)
- [Template](https://github.com/jupyter/enhancement-proposals/blob/master/jupyter-enhancement-proposal-guidelines/JEP-TEMPLATE.md)

# Summary

```
One paragraph explanation of the proposal.
```

This JEP defines how React.js technology can be used to build user interfaces in Jupyter related projects.

This covers the creation of a `ui-toolkit` focused on React.js `widgets` which can also be a basis for other frontend technologies like Vue.js or Svelte. On top of that toolkit, extended functionalites on how `reactivity` and `collaboration` are also discussed here, in relationship with [Jupyter Widgets](https://github.com/jupyter-widgets) and current JupyterLab RTC features.

# Motivation

```
Why are we doing this? What use cases does it support? What is the expected outcome?
```

We had previous discussions about UI toolkit in various Jupyter projects and so far have seen the usage of different solutions. This has even driven to creating user interfaces built upon completely different widgets, resulting in non coherent look-and-feel that do not respond correctly to a desired theme. The communication and integration of those various technologies to be a single page application had also generated frustruations and discussion. The different solutions are often incompatible and are driving fragmentation of the overall Jupyter ecosystem.

With a better definition on which toolkit to use, we aim to help the various core Jupyter projects and their third-party extension developers to converge to a unified and more coherent end-user experience.

In first instance, the outcome of this JEP will be `ui-toolkit` with [React.js](https://reactjs.org) components backed by [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components). The Web Components qspect that will allow third-party developers to create some widgets in others technologies like e.g. [Vue.js](https://vuejs.org), [Svelte](https://svelte.dev).

# Guide-level explanation

```
Explain the proposal as if it was already implemented and you were explaining it to another community member. That generally means:

- Introducing new named concepts.
- Adding examples for how this proposal affects people's experience.
- Explaining how others should *think* about the feature, and how it should impact the experience using Jupyter tools. It should explain the impact as concretely as possible.
- If applicable, provide sample error messages, deprecation warnings, or migration guidance.
- If applicable, describe the differences between teaching this to existing Jupyter members and new Jupyter members.

For implementation-oriented JEPs, this section should focus on how other Jupyter developers should think about the change, and give examples of its concrete impact. For policy JEPs, this section should provide an example-driven introduction to the policy, and explain its impact in concrete terms.
```

The following defines key concepts used in today frontend landscape:

- Vanilla JavaScript is not enough to create rich user interface in a efficient way. It is the closest layer to the DOM, giving the most control, but lacks higher level abstractions.
- [jQuery](https://jquery.com) is a framework that has been extensively used to ease the developer experience. jQuery is used by the [Jupyter Notebook](https://github.com/jupyter/notebook) and historically by [JupyterHub](https://gitter.im/jupyterhub/jupyterhub).
- jQuery is now being overruled by solutions like [React.js](https://reactjs.org), [Vue.js](https://vuejs.org), [Svelte](https://svelte.dev)..., which we can be called as "advanced frameworks" that simply and empower the JavaScript developer. Each of these "advanced toolkits" do not ship usable widgets and just provide advanced primitives like a virtual-DOM for render, refresh, local state... In the React.js case, the developer can create widgets from scratchof choose an existing toolkit like [Material-UI](https://mui.com), [Chakra-UI](https://chakra-ui.com).
- [JupyterLab Lumino](https://github.com/jupyterlab/lumino) is a framework close to the DOM that is used to create the JupyterLab user interface. Outside of JupyterLab, its usage is limited and it may miss features available in other solutions like virtual-DOM. It is important to note that Lumino can embed React.js components, but that a React.js application can not reuse Lumino widgets. This means that Lumino can not be used by React.js developers. This is also true for any Vue.js, Svelte... developers who can not reuse Lumino widgets.
- [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) "is a suite of different technologies allowing you to create reusable custom elements — with their functionality encapsulated away from the rest of your code — and utilize them in your web apps" (quote from Mozilla developer).
- A `Reactive UI` is not available today in Jupyter and can be defined as ... (see https://en.wikipedia.org/wiki/Reactive_user_interface, better defintion?). The best known example of such a UI is [ObservableHQ](https://observablehq.com).
- A `global state` is not provided by the "advanced framework". React.js developers usually have to choose from existing solutions like [Redux](https://redux.js.org), [Mobx](https://mobx.js.org). For Vue.js, [Vuex](https://vuex.vuejs.org) is an option.
- `Collaborative`:...
- `Local-first` UI: ...

Actually, the usage of those technologies at Jupyter is:

- Notebook: Relies on jQuery.
- JupyterLab: Relies on Lumino, potentially with React.js underneath.
- JupyterHub: Relies on React.js (was jQuery until last year).
- Nteract: Relies on React.js.

The goal is to create a widget toolkit that is usable by `React.js` developers, while being `Reactive` and `Collaborative`. The migration plan for an existing implementation has to be `non-breaking`.

# Reference-level explanation

```
This is the technical portion of the JEP. Explain the design in sufficient detail that:

- Its interaction with other features is clear.
- It is reasonably clear how the feature would be implemented.
- Corner cases are dissected by example.

The section should return to the examples given in the previous section, and explain more fully how the detailed proposal makes those examples work.
```

- React.js: ...
- Reactive: ...
- Collaborative: ...

# Rationale and alternatives

```
- Why is this choice the best in the space of possible designs?
- What other designs have been considered and what is the rationale for not choosing them?
- What is the impact of not doing this?
```

We want to provide widgets developed in a well adopted toolkit so that existing community can simply use them, instead of asking the javascript developer to learn a new framework (for example Lumino).

We have looked on various leading frontend technologies (React.js, Vue.js, Svelte...) and based on the existing usage in the various Jupyter projects (JupyterLab, Nteract, JupyterHub), React.js is the best way to move forward. There are a lot of widget toolkits built on top of React.js (Material-UI, Chakra-UI...)

We also see in the market more and more custom closed-source and open-source solutions providing notebook experiences and can expect actors will come with easy to use solutions to build custom user interface. If Jupyter does not move with a solutions, there is a risk that developers, and consequently users, will move to another 

# Prior art

```
Discuss prior art, both the good and the bad, in relation to this proposal.
A few examples of what this can include are:

- Does this feature exist in other tools or ecosystems, and what experience have their community had?
- For community proposals: Is this done by some other community and what were their experiences with it?
- For other teams: What lessons can we learn from what other communities have done here?
- Papers: Are there any published papers or great posts that discuss this? If you have some relevant papers to refer to, this can serve as a more detailed theoretical background.

This section is intended to encourage you as an author to think about the lessons from other languages, provide readers of your JEP with a fuller picture.
If there is no prior art, that is fine - your ideas are interesting to us whether they are brand new or if it is an adaptation from other languages.
```

- https://github.com/jupyterlab/extension-examples
- https://github.com/nteract/nteract
- Jupyter React https://github.com/datalayer/jupyter-react
- Component library for building web interfaces in Jupyter ecosystem (JupyterHub, Jupyter Widgets, JupyterLab,...) https://github.com/jupyterlab-contrib/jupyter-ui-toolkit

# Unresolved questions

```
- What parts of the design do you expect to resolve through the JEP process before this gets merged?
- What related issues do you consider out of scope for this JEP that could be addressed in the future independently of the solution that comes out of this JEP?
```

In scope: Base widget toolkit.

Out-of-scope: Reactive and collaborative.

# Future possibilities

```
Think about what the natural extension and evolution of your proposal would
be and how it would affect the Jupyter community at-large. Try to use this section as a tool to more fully consider all possible
interactions with the project and language in your proposal.
Also consider how the this all fits into the roadmap for the project
and of the relevant sub-team.

This is also a good place to "dump ideas", if they are out of scope for the
JEP you are writing but otherwise related.

If you have tried and cannot think of any future possibilities,
you may simply state that you cannot think of anything.

Note that having something written down in the future-possibilities section
is not a reason to accept the current or a future JEP; such notes should be
in the section on motivation or rationale in this or subsequent JEPs.
The section merely provides additional information.
```

- Global state: Although not desirable, it should be possible for a React.js widget to share a global state with a widget deveoper in another technology (Vue.js, Svelte...)
- Reactivity: cfr [Jupyter Widgets](https://github.com/jupyter-widgets)
- Realtime collaboration.
- Local-first.

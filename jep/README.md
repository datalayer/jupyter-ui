---
title: React.js at Jupyter
authors: Eric Charles (@echarles)
issue-number: <pre-proposal-issue-number>
pr-number: <proposal-pull-request-number>
date-started: 2022-02-08
---

> JEP for Jupyter UI Components

This is a draft content towards a JEP for `Jupyter UI Components` based on the official [template](https://github.com/jupyter/enhancement-proposals/blob/master/jupyter-enhancement-proposal-guidelines/JEP-TEMPLATE.md).

Once more preliminary feedback gathered, it will be submitted as a JEP (Jupyter Enhancement Proposal). We welcome contributors and reviewers in this early inception phase. More information on the JEP process can be read on:

- [Guidelines](https://jupyter.org/enhancement-proposals/jupyter-enhancement-proposal-guidelines/jupyter-enhancement-proposal-guidelines.html)
- [Repo](https://github.com/jupyter/enhancement-proposals)
- [Template](https://github.com/jupyter/enhancement-proposals/blob/master/jupyter-enhancement-proposal-guidelines/JEP-TEMPLATE.md)

# Summary

```
One paragraph explanation of the proposal.
```

This JEP defines how React.js technology can be used to build user interfaces in Jupyter related projects.

The deliverable will be the creation of a `ui-components` repository providing accessible and themed widgets fully compatible with React.js. But without blocking usage by other popular frontend technologies like Vue.js or Svelte.

On top of those components, extended functionalities on `reactivity` and `collaboration` are also discussed here. But they are out-of-scope of the deliverable. It makes sense to already discuss those last aspects in relationship with [Jupyter Widgets](https://github.com/jupyter-widgets) and the current JupyterLab Realtime collaboration features.

We propose to move the current https://github.com/jupyterlab-contrib/jupyter-ui-toolkit repository to a Jupyter top-level repository. The home of that repository and the npm.js package naming still needs to be defined. That repository will be advertised as the default way to build user interface that conform to the Jupyter guidelines.

# Motivation

```
Why are we doing this? What use cases does it support? What is the expected outcome?
```

Various community members, in their own group, had discussions about UI components and so far we have seen the emergence and use of different solutions. This has driven to the creation user interfaces relying on completely different widgets, resulting in non coherent look-and-feel that do not respond correctly to a desired theme. The communication and integration of those various technologies to act a single page application had also generated frustruations. The different solutions are often incompatible and are driving fragmentation of the overall Jupyter ecosystem.

With a better definition on which components to use, we aim to help the various core Jupyter projects and the third-party extension developers to converge to a unified and more coherent end-user experience. This will also ease the development of complex widgets and remix applications by composing on-shelves components with few styling rules focusing on positioning rather than theming.

In first instance, the outcome of this JEP will be `ui-components` with [React.js](https://reactjs.org) components support backed by [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components). The Web Components aspect will allow third-party developers to include the widgets in others technologies like e.g. [Vue.js](https://vuejs.org), [Svelte](https://svelte.dev).

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

The following defines key concepts used in today frontend landscape that we want to take into consideration in this JEP:

- Vanilla JavaScript is not enough to create rich user interface in a efficient way. It is the closest layer to the DOM, giving the most control, but lacks higher level abstractions.
- [jQuery](https://jquery.com) is a framework that has been extensively used to ease the developer experience. jQuery is used by the [Jupyter Notebook](https://github.com/jupyter/notebook) and historically by [JupyterHub](https://gitter.im/jupyterhub/jupyterhub).
- jQuery is now being overruled by solutions like [React.js](https://reactjs.org), [Vue.js](https://vuejs.org), [Svelte](https://svelte.dev)..., which we can be called as `advanced frameworks` that simplify and empower the JavaScript developer. Each of these `advanced frameworks` do not ship usable widgets and provide advanced primitives like a virtual-DOM to render, refresh, manage local state... In the React.js case, the developer can create widgets from scratch or choose an existing toolkit like e.g. [Material-UI](https://mui.com), [Chakra-UI](https://chakra-ui.com).
- [Lumino](https://github.com/jupyterlab/lumino) is a framework close to the DOM, supporting extensions, that is maintained and used by JupyterLab to create its own user interface. Outside of JupyterLab, its usage is limited and it may miss features available in other solutions like virtual-DOM. It is important to note that Lumino can embed React.js components, but that a React.js application can not reuse Lumino widgets. This means that Lumino can not be used by React.js developers. This is also true for any Vue.js, Svelte... developers who can not reuse Lumino widgets.  
This is one of the main pain point for external parties that are interested in integrating some JupyterLab features in their products.
- [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) "is a suite of different technologies allowing you to create reusable custom elements — with their functionality encapsulated away from the rest of your code — and utilize them in your web apps" (quote from Mozilla developer).  
They are built on the [custom element](https://html.spec.whatwg.org/multipage/custom-elements.html#dom-window-customelements) web standard.
- A `Reactive UI` is not available today in Jupyter and can be defined as ... (see https://en.wikipedia.org/wiki/Reactive_user_interface, better defintion?). The best known example of such a UI is [ObservableHQ](https://observablehq.com).
- A `global state` is not provided by the "advanced framework". React.js developers usually have to choose from existing solutions like [Redux](https://redux.js.org), [Mobx](https://mobx.js.org). For Vue.js, [Vuex](https://vuex.vuejs.org) is an option.
- `Local-first`: Read more about the Local-first applications [in this article](https://www.inkandswitch.com/local-first), "a set of principles for software that enables both collaboration and ownership for users".

The current usage of those technologies at Jupyter is:

- Notebook until V6: Relies on jQuery.
- Notebook V7: Relies on Retrolab, thus on Lumino and JupyterLab (https://jupyter.org/enhancement-proposals/79-notebook-v7/notebook-v7.html).
- JupyterLab: Relies on Lumino, potentially with React.js underneath.
- JupyterHub: Relies on jQuery and React.js.
- Nteract: Relies on React.js.

The goal is to create an accessible themed widgets components that is usable by developers (with a focus on _React.js_ usage), while being **Reactive**,  **Collaborative** and easy to integrate outside official Jupyter projects. The migration plan from an existing implementation has to be **non-breaking** and **progressive** (non need to switch everything at once).

# Reference-level explanation

```
This is the technical portion of the JEP. Explain the design in sufficient detail that:

- Its interaction with other features is clear.
- It is reasonably clear how the feature would be implemented.
- Corner cases are dissected by example.

The section should return to the examples given in the previous section, and explain more fully how the detailed proposal makes those examples work.
```

We propose to build the widget toolkit on the current work being done at https://github.com/jupyterlab-contrib/jupyter-ui-toolkit. The features of that library include:

- **Implements the Jupyter design language:** All components follow the design language of Jupyter
  – enabling developers to create extensions that have a consistent look and feel with the rest of
  the ecosystem.
- **Automatic support for color themes:** All components are designed with theming in mind and will
  automatically display the current application theme.
- **Use any tech stack:** The library ships as a set of web components, meaning developers can use
  the toolkit no matter what tech stack (React, Vue, Svelte, etc.) their extension is built with.
- **Accessible out of the box:** All components ship with web standard compliant ARIA labels and
  keyboard navigation.

This jupyter-ui-toolkit repository contains three packages:

- [`@jupyter-notebook/web-components`](https://github.com/jupyterlab-contrib/jupyter-ui-toolkit/tree/main/packages/components/):
  The main package defining the web components.
- [`@jupyter-notebook/react-components`](https://github.com/jupyterlab-contrib/jupyter-ui-toolkit/tree/main/packages/react-components):
  Wrapped the web components to use them with [React](https://reactjs.org).
- [`jupyter-ui-demo`](https://github.com/jupyterlab-contrib/jupyter-ui-toolkit/tree/main/packages/lab-example):
  Unpublished JupyterLab extension to demonstrate the integration of the toolkit.

Those features are brought through the [Fast Design](https://www.fast.design), a Microsoft backed project, released under [MIT license](https://github.com/microsoft/fast/blob/master/LICENSE).

The reader needs to understand that we are not reusing components but really redeveloping them on a modern stack. The drawback is that we have to invest energy to build and maintain those components, the unbeatable advantage is that we can build widgets suited to the very specific needs of Jupyter, having all sorts of data-driven widgets.

Creating custom element from scratch is possible. That process can be fasten by using third party libraries like Fast Design (by Microsoft) or [Lit](https://lit.dev) (by Google). Those libraries create components that can be integrated in more advanced frameworks. But like choosing one of those frameworks, the library chosen to create the toolkit will lock some choices for the toolkit development. For example, Fast Design goes beyond Lit by providing a design system based on observable [Design Tokens](https://www.fast.design/docs/design-systems/design-tokens) that ultimately define [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) for styling the widgets.

A known limitation of custom elements is the impossibility to use two elements with identical names. Cross libraries naming clashes is avoided by prefixing the element names (e.g. in jupyter-ui-toolkit the elements are prefixed by `jp-`). But this can likely happen when two different versions of the same library are loaded within the same page. This imposes to use only one version of the library in a web page. This can be mitigated by the documentation and by enforcing placing that library in the shared module scope when bundling the web application.

# Rationale and alternatives

```
- Why is this choice the best in the space of possible designs?
- What other designs have been considered and what is the rationale for not choosing them?
- What is the impact of not doing this?
```

We want to provide widgets developed in a well adopted toolkit so that existing community can simply use them, instead of asking the javascript developer to learn a new framework (for example Lumino).

We have looked on various leading frontend technologies (React.js, Vue.js, Svelte...) and based on the existing usage in the various Jupyter projects (JupyterLab, Nteract, JupyterHub) and the experience of lots of contributors, React.js is the best way to move forward.

We also see in the market more and more custom closed-source and open-source solutions providing notebook experiences and can expect actors will come with easy to use solutions to build custom user interface. If Jupyter does not move with a solution, there is a risk that developers, and consequently users, will move to their own solution, with a risk that it can become a de-facto standard.  
By building our own components that eases integration for other players, we have an opportunity to increase contributions in the open-source Jupyter community.

Regarding the choice of [Fast Design](https://www.fast.design), an alternative is [Lit](https://lit.dev) backed by Google. The main disadvantage for Lit is the lack of out-of-the box widgets to start with, the absence of design system and the really centric focus on pure Web Elements which does not take into account React.js, Vue.js... . Therefore, we think Fast Design is a more adequate library to build upon. Note also that today Fast integrates with Angular, Ember, React.js, Vue.js... but not yet with Svelte. Lit provides [Reactive Controllers](https://lit.dev/docs/composition/controllers) which is a mean [similar to the React.js hook mechanism](https://github.com/lit/lit/tree/main/packages/labs/react#usecontroller) and is not mandatory is our case and is a feature that should be looked with the next discussions around a global state.

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

The following constitutes a non-exclusive list of prior art:

- [JupyterLab](https://github.com/jupyterlab/extension-examples/tree/master/react-widget) extension example using a React.js component.
- [Nteract](https://github.com/nteract/nteract) is a React.js notebook.
- [Jupyter React](https://github.com/datalayer/jupyter-react) is a library with React.js components to create data products compatible with the Jupyter ecosystem.
- [Vue Lumino](https://github.com/tupilabs/vue-lumino) allows to reuse the Lumino docking panel system in a Vue application. It is limited to docking aspects and will benefit from the components proposed in this JEP.
- [Jupyter Widgets](https://github.com/jupyter-widgets) for a reactive solution that imply both frontend and backend.
- [JupyterHub management](https://github.com/jupyterhub/jupyterhub/tree/main/jsx) UI on top of React.js Bootstrap widgets.
- [CoCalc](https://github.com/sagemathinc/cocalc) connects to Jupyter Kernels with a frontend developed in Reacts.js.
- [UI Toolkit](https://github.com/jupyterlab-contrib/jupyter-ui-toolkit) is a component library for building web interfaces in Jupyter ecosystem (JupyterHub, Jupyter Widgets, JupyterLab,...). This JEP proposes to built on top tof this implementation.

# Unresolved questions

```
- What parts of the design do you expect to resolve through the JEP process before this gets merged?
- What related issues do you consider out of scope for this JEP that could be addressed in the future independently of the solution that comes out of this JEP?
```

Base components are in-scope of this JEP. Reactivity and collaboration/local-first are out-of-scope of this JEP.

It should be possible for a React.js widget to share a global state with a widget developed in another technology (Vue.js, Svelte...). This can be achieved by a adequate global state/store system that is not restricted a single technology (so should be `polyglot`). This can be defined in subsequent JEP.

Realtime collaboration and local-first applications are not in-scope for now but it is logical to mention that and to anticipate they will depend on a CRDT solution (e.g. Y.js in use for now in JupyterLab). We could imagine a global state being responsible to synchronize the model via CRDT messages. Such implementations are already being worked on with well-know global state systems like Redux, with e.g. [Y.js binding to Redux](https://github.com/lscheibel/redux-yjs-bindings). The UI components should thus be able to easily bind to such market standard global states.

Reactivity to support features like [Jupyter Widgets](https://github.com/jupyter-widgets) can be defined in subsequent JEP. The current implementation of Jupyter Widgets relies on [Backbone.js](https://backbonejs.org) for which a successor would be welcome. We could imagine relying on the collaborative feature based on CRDT (Conflict-free replicated data types).

The integration with the current Lumino extension system could be considered in the future. As this is a bit more complex to design, especially to support multiple technologies (not only React.js), we think a separated discussion will be better for that. However we think the strengths of the JupyterLab ecosystem is its extension system. Developers will expect being able to reuse all the existing extensions that have been developed over the past years as is. So the UI components presented here should somehow be compatible with it. Lumino to be upgraded to be compatible with [InversifyJS](https://github.com/inversify/InversifyJS), a lightweight inversion of control container for JavaScript. The technology put in place for this JEP once matured could be used to migrate the current Lumino widgets and extensions foundations to ease their integration into modern frameworks. There are also ongoing discussion to add more React.js and Web Component features in the Lumino toolkit, these topics should be discussed in their respective issues:

- Lumino v2 Plan https://github.com/jupyterlab/lumino/issues/233
- Switch from widget to standard web components https://github.com/jupyterlab/lumino/issues/290

The home of the `ui-components` repository and the npm.js package naming still need to be defined (read more on https://github.com/jupyterlab/retrolab/issues/313 and https://github.com/jupyter/notebook-team-compass/issues/2). The ideal naming would be `@jupyter/ui-components` (please note that the npm.js jupyter org is hold by someone else and that npm.js has not yet answered to our request to get that org back).

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

As mentioned earlier, subsequent JEP are expected to answer the open questions.

The components will target basic visual functions like buttons, drop-down... and will not deliver higher level components like a usable `Cell`, or a collection of cells showing a basic `Notebook` connected to a running Kernel. Such components are for example available in the [Jupyter React](https://github.com/datalayer/jupyter-react) and would demeand further discussion around global state, connection to the services hosted on a server...

We are also looking to use the current widgets in JupyterLab extensions (e.g. [image editor](https://github.com/madhur-tandon/jlab-image-editor/) and [search accross files](https://github.com/jupyterlab-contrib/search-replace)) and third party solutions (e.g. [quetz-frontend](https://github.com/mamba-org/quetz-frontend)). Once released, we hope that existing solutions like e.g. the JupyterHub management UI will use them.

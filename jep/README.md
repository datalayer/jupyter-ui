---
title: React.js at Jupyter
authors: Eric Charles (@echarles)
issue-number: <pre-proposal-issue-number>
pr-number: <proposal-pull-request-number>
date-started: 2022-02-08
---

> JEP for Jupyter UI Components

This is a draft towards a JEP (Jupyter Enhancement Proposal) for `Jupyter UI Components` based on the official [template](https://github.com/jupyter/enhancement-proposals/blob/master/jupyter-enhancement-proposal-guidelines/JEP-TEMPLATE.md).

Once more preliminary feedback is gathered, it will be submitted as a JEP. We welcome contributors and reviewers in this early inception phase. More information on the JEP process:

- [Guidelines](https://jupyter.org/enhancement-proposals/jupyter-enhancement-proposal-guidelines/jupyter-enhancement-proposal-guidelines.html)
- [Repo](https://github.com/jupyter/enhancement-proposals)
- [Template](https://github.com/jupyter/enhancement-proposals/blob/master/jupyter-enhancement-proposal-guidelines/JEP-TEMPLATE.md)

# Summary

This JEP proposes the adoption of well defined `UI Components` across Jupyter projects needed to build user interfaces. While being primarily focussed on [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) and [React.js](https://reactjs.org), the creation of components based on other technologies like [Vue.js](https://vuejs.org) and [Svelte](https://svelte.dev) will be possible.

The deliverable will be the creation of a `ui-components` repository providing accessible and themed widgets fully compatible with React.js, without blocking usage by other popular frontend technologies.

The components will target basic visual functions like buttons, drop-down... and will not deliver higher-level components like a usable `Cell`, or a collection of cells showing a basic `Notebook` connected to a running Kernel. Such components are for example available in the [Jupyter React](https://github.com/datalayer/jupyter-react) and would demand further discussion around global state, reactivity, connection to the services hosted on a server...

On top of those components, extended functionalities on `reactivity` and `collaboration` are also discussed here. But they are out-of-scope for the deliverable. However, it makes sense to discuss those last aspects in this document in relation to [Jupyter Widgets](https://github.com/jupyter-widgets) and the current JupyterLab [real time collaboration](https://jupyterlab.readthedocs.io/en/stable/user/rtc.html) features.

The fundamental components are built on the [FAST framework](https://www.fast.design/) that follow [WCAG 2.1](https://www.w3.org/WAI/standards-guidelines/wcag/), are [W3C spec-compliant](https://www.w3.org/TR/wai-aria-1.2) and use the [W3C interaction models](https://www.w3.org/TR/wai-aria-practices-1.2/) when available.

We propose to move the current https://github.com/jupyterlab-contrib/jupyter-ui-toolkit repository to a Jupyter top-level repository. The home of that repository and the npm.js package naming still needs to be defined. That repository will be advertised as the default way to build user interfaces that conform to the Jupyter guidelines.

# Motivation

Various community members, in their own group, had discussions about UI components and so far we have seen the emergence and use of different solutions. This has led to the creation of user interfaces relying on completely different widgets, resulting in an incoherent look-and-feel that does not respond correctly to a desired theme. The communication and integration of those various technologies to act as a single page application had also generated frustrations. The different solutions are often incompatible and are driving fragmentation of the overall Jupyter ecosystem.

With a better definition on which components to use, we aim to help the various core Jupyter projects and the third-party extension developers to converge to a unified and more coherent end-user experience. This will also ease the development of complex widgets and remixing them by providing composeable, off-the-shelf components with minimal styling rules for positioning (rather than extensive theming).

In the first instance, the outcome of this JEP will be `ui-components`: [React.js](https://reactjs.org) components support backed by [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components). The Web Components aspect will allow third-party developers to include the widgets in others technologies like e.g. [Vue.js](https://vuejs.org), [Svelte](https://svelte.dev).

Current solutions also share varying levels of accessibility; none were built with such concerns in mind from the start.
For Jupyter projects to be truly open to everyone, accessibility needs to become standard. Having a common set of components for
Jupyter projects with user interfaces takes some of the burden off individuals by providing foundational accessibility
considerations built in. By endorsing a standard set of components with accessibility considerations at its core, Project Jupyter is
also communicating the expectation that projects, contributions, and communities follow suit in evaluating and improving their own holistic approach to accessibility.

# Guide-level explanation

The following defines key concepts used in today's frontend landscape that we want to take into consideration in this JEP:

- Vanilla JavaScript is not enough to create rich user interface in a efficient way. It is the closest layer to the DOM, giving the most control, but lacks higher level abstractions.
- [jQuery](https://jquery.com) is a framework that has been extensively used to ease the developer experience. jQuery is used by the [Jupyter Notebook](https://github.com/jupyter/notebook) and historically by [JupyterHub](https://gitter.im/jupyterhub/jupyterhub).
- jQuery is now being overthrown by solutions like [React.js](https://reactjs.org), [Vue.js](https://vuejs.org), and [Svelte](https://svelte.dev), which we will call `advanced frameworks` that empower the JavaScript developer. Each of these `advanced frameworks` does not ship usable widgets but it does provide advanced primitives like a virtual DOM to render, refresh, manage local state... In the React.js case, the developer can create widgets from scratch or choose an existing toolkit like e.g. [Material-UI](https://mui.com), [Chakra-UI](https://chakra-ui.com).
- [Lumino](https://github.com/jupyterlab/lumino) is a framework close to the DOM, supporting extensions, that is maintained and used by JupyterLab to create its own user interface. Outside of JupyterLab, its usage is limited and it may miss features available in other solutions like virtual DOM. It is important to note that Lumino can embed React.js components, but that a React.js application cannot integrate Lumino widgets. This means that Lumino cannot be used by React.js developers. The same goes for Vue.js, Svelte...
This is one of the main pain points for external parties that are interested in integrating some JupyterLab features in their products.
- [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) "is a suite of different technologies allowing you to create reusable custom elements — with their functionality encapsulated away from the rest of your code — and utilize them in your web apps" (quote from MDN).
They are built on the [custom element](https://html.spec.whatwg.org/multipage/custom-elements.html#dom-window-customelements) web standard.
- A `Reactive UI` is not available today in Jupyter. The best known example of such a UI is [ObservableHQ](https://observablehq.com).
- A `global state` is not provided by the "advanced framework". React.js developers usually have to choose from existing solutions like [Redux](https://redux.js.org) or [Mobx](https://mobx.js.org). For Vue.js, [Vuex](https://vuex.vuejs.org) is an option.
- `Local-first`: Read more about the Local-first applications [in this article](https://www.inkandswitch.com/local-first), "a set of principles for software that enables both collaboration and ownership for users".

The current usage of those technologies at Jupyter is:

- Notebook until V6: Relies on jQuery.
- Notebook V7: Relies on Retrolab, thus on Lumino and JupyterLab (https://jupyter.org/enhancement-proposals/79-notebook-v7/notebook-v7.html).
- JupyterLab: Relies on Lumino, potentially with React.js underneath.
- JupyterHub: Relies on jQuery and React.js.
- Nteract: Relies on React.js.

The goal is to create accessible themed components that are usable by developers (with a focus on _React.js_ usage), while being **reactive**, **collaborative** and easy to integrate outside official Jupyter projects. The migration plan from an existing implementation has to be **non-breaking** and **progressive** (no need to switch everything at once).

# Reference-level explanation

We propose to build the widget toolkit on the current work being done at https://github.com/jupyterlab-contrib/jupyter-ui-toolkit. The features of that library include:

- **Implements the Jupyter design language:** All components follow the design language of Jupyter
  – enabling developers to create extensions that have a consistent look and feel with the rest of
  the ecosystem.
- **Automatic support for color themes:** All components are designed with theming in mind and will
  automatically display the current application theme.
- **Use any tech stack:** The library ships as a set of Web Components, meaning developers can use
  the toolkit no matter what tech stack (React, Vue, Svelte, etc.) their extension is built with.
- **Accessible foundations out of the box:** All components ship with web standard compliant ARIA labels,
  keyboard navigation and accessible color contrast from the start.

This jupyter-ui-toolkit repository contains three packages:

- [`@jupyter-notebook/web-components`](https://github.com/jupyterlab-contrib/jupyter-ui-toolkit/tree/main/packages/components/):
  The main package defining the web components.
- [`@jupyter-notebook/react-components`](https://github.com/jupyterlab-contrib/jupyter-ui-toolkit/tree/main/packages/react-components):
  A package that wraps the web components for use with [React](https://reactjs.org). This package may become obsolete very soon as native support in `React` for Web Components [may land in v18](https://github.com/facebook/react/issues/11347#issuecomment-988970952).
- [`jupyter-ui-demo`](https://github.com/jupyterlab-contrib/jupyter-ui-toolkit/tree/main/packages/lab-example):
  Unpublished JupyterLab extension to demonstrate the integration of the toolkit.

Those features are brought through [Fast Design](https://www.fast.design), a Microsoft backed project, released under [MIT license](https://github.com/microsoft/fast/blob/master/LICENSE).

The reader needs to understand that we are not reusing components but really redeveloping them on a modern stack. The drawback is that we have to invest energy to build and maintain those components. The unbeatable advantage is that we can build widgets suited to the very specific needs of Jupyter, having all sorts of data-driven widgets.

Creating custom elements from scratch is possible. That process can be sped up by using third party libraries like Fast Design (by Microsoft) or [Lit](https://lit.dev) (by Google). Those libraries create components that can be integrated in more advanced frameworks. But like choosing one of those frameworks, the library chosen to create the toolkit will lock some choices for the toolkit development. For example, Fast Design goes beyond Lit by providing a design system based on observable [Design Tokens](https://www.fast.design/docs/design-systems/design-tokens) that ultimately define [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) for styling the widgets.

A known limitation of custom elements is the impossibility to use two elements with identical names. Naming clashes are avoided by prefixing the element names (e.g. in jupyter-ui-toolkit the elements are prefixed by `jp-`). But clashes can still happen when two different versions of the same library are loaded within the same page. This imposes the use of only one version of the library in a web page. This can be mitigated by the documentation and by enforcing placing that library in the shared module scope when bundling the web application.

# Rationale and alternatives

We want to provide widgets developed in a well adopted toolkit so that existing communities can simply use them, instead of asking JavaScript developers to learn a new framework (for example Lumino).

We have looked on various leading frontend technologies (React.js, Vue.js, Svelte...) and based on the existing usage in the various Jupyter projects (JupyterLab, Nteract, JupyterHub) and the experience of lots of contributors, React.js is the best way to move forward.

We also see in the market more and more custom closed-source and open-source solutions providing notebook experiences and can expect actors will come with easy to use solutions to build custom UI. If Jupyter does not move with a solution, there is a risk that developers, and consequently users, will move to their own solutions, with the risk that one of them becomes the de-facto standard.
By building our own components that ease integration for other players, we have an opportunity to increase contributions in the open-source Jupyter community.

Regarding the choice of [Fast Design](https://www.fast.design), an alternative is [Lit](https://lit.dev) backed by Google. The main disadvantage for Lit is the lack of out-of-the box widgets to start with, the absence of a design system and the pure Web Element-centric focus that does not take into account React.js, Vue.js... Therefore, we think Fast Design is a more adequate library to build upon. Note also that Fast integrates with Angular, Ember, React.js, Vue.js... but not yet with Svelte. Lit provides [Reactive Controllers](https://lit.dev/docs/composition/controllers) which is a means [similar to the React.js hook mechanism](https://github.com/lit/lit/tree/main/packages/labs/react#usecontroller) and is not mandatory is our case but is a feature that should be examined with the next discussions around a global state.

# Prior art

The following constitutes a non-exclusive list of prior art:

- JupyterLab [extension example using a React.js component](https://github.com/jupyterlab/extension-examples/tree/master/react-widget).
- [Nteract](https://github.com/nteract/nteract) is a React.js notebook.
- [Jupyter React](https://github.com/datalayer/jupyter-react) is a library with React.js components to create data products compatible with the Jupyter ecosystem.
- [Vue Lumino](https://github.com/tupilabs/vue-lumino) allows using the Lumino docking panel system in a Vue application. It is limited to docking aspects and will benefit from the components proposed in this JEP. Indeed Web Components are directly usable within Vue. So such wrappers should no longer be needed if the Lumino widgets were to be converted to that technology.
- [Jupyter Widgets](https://github.com/jupyter-widgets) for a reactive solution that involves both frontend and backend.
- [JupyterHub management](https://github.com/jupyterhub/jupyterhub/tree/main/jsx) UI on top of React.js Bootstrap widgets.
- [CoCalc](https://github.com/sagemathinc/cocalc) connects to Jupyter Kernels with a frontend developed in Reacts.js.
- [UI Toolkit](https://github.com/jupyterlab-contrib/jupyter-ui-toolkit) is a component library for building web interfaces in Jupyter ecosystem (JupyterHub, Jupyter Widgets, JupyterLab, etc.) This JEP proposes to build on top of this implementation.

# Unresolved questions

Base components are in-scope of this JEP. Reactivity and collaboration/local-first are out-of-scope of this JEP.

It should be possible for a React.js widget to share a global state with a widget developed in another technology (Vue.js, Svelte...). This can be achieved by an adequate global state/store system that is not restricted to a single technology (so should be **polyglot**). This can be defined in a subsequent JEP.

Realtime collaboration and local-first applications are not in-scope for now but it is logical to mention that and to anticipate that they will depend on a CRDT solution (Conflict-free replicated data types). For example, Y.js is in use for now in JupyterLab. We could imagine a global state to synchronize the model via CRDT messages. Such implementations are already being worked on with well-know global state systems like Redux, with e.g. [Y.js binding to Redux](https://github.com/lscheibel/redux-yjs-bindings). The UI components should thus be able to easily bind to such industry standard global state managers.

At some point, Jupyter frontend developers may alos be interested to build `Reactive` frontends on top of those components in relationship with the [Jupyter Widgets](https://github.com/jupyter-widgets). Such `Reactive` frontends to support and integrate with [Jupyter Widgets](https://github.com/jupyter-widgets) can be defined in a subsequent JEP. The current implementation of Jupyter Widgets relies on [Backbone.js](https://backbonejs.org) for which a successor would be welcome. We could imagine such reactive feature based on CRDT that would play nicely with the current collaborative features.

Integration with the current Lumino extension system could be considered in the future. As this is a bit more complex to design, especially to support multiple technologies (not only React.js), we think a separate discussion will be better for that. However we think the strength of the JupyterLab ecosystem lies in its extension system. Developers will expect to be able to reuse all the existing extensions that have been developed over the past years as-is. So the UI components presented here should somehow be compatible with it. Lumino could be upgraded to be compatible with [InversifyJS](https://github.com/inversify/InversifyJS), a lightweight inversion-of-control container for JavaScript. The technology put in place for this JEP, once matured, could be used to migrate the current Lumino widgets and extensions foundations to ease their integration into modern frameworks. There are also ongoing discussion to add more React.js and Web Component features in the Lumino toolkit, these topics should be discussed in their respective issues:

- [Lumino v2 Plan](https://github.com/jupyterlab/lumino/issues/233)
- [Switch from widget to standard web components](https://github.com/jupyterlab/lumino/issues/290)

The home of the `ui-components` repository and the npm.js package naming still need to be defined (read more on https://github.com/jupyterlab/retrolab/issues/313 and https://github.com/jupyter/notebook-team-compass/issues/2). The ideal naming would be `@jupyter/ui-components` (please note that the npm.js `@jupyter` org is held by someone else and that npm.js has not yet answered our request to get that org back).

# Future possibilities

As mentioned earlier, subsequent JEP are expected to answer the open questions.

We are also looking to use the [current components being developed](https://github.com/jupyterlab-contrib/jupyter-ui-toolkit) in JupyterLab extensions (e.g. [image editor](https://github.com/madhur-tandon/jlab-image-editor/) and [search accross files](https://github.com/jupyterlab-contrib/search-replace)) and third party solutions (e.g. [quetz-frontend](https://github.com/mamba-org/quetz-frontend)). Once released, we hope that existing solutions like e.g. the JupyterHub management UI will use them.
